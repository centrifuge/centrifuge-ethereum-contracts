pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721Metadata.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721Enumerable.sol";
import "contracts/AnchorRepository.sol";
import "contracts/lib/MerkleProof.sol";

/**
 * @title UserMintableERC721
 * Base contract for minting NFTs using documents from the Centrifuge protocol
 * The contract uses precise-proofs(https://github.com/centrifuge/precise-proofs) for proving
 * document fields against an on chain single source of truth repository of all
 * documents in the Centrifuge network called AnchorRepository
 * The precise proofs validation expects proof generation with compact properties  https://github.com/centrifuge/centrifuge-protobufs
 */
contract UserMintableERC721 is Initializable, ERC721, ERC721Enumerable, ERC721Metadata {
  // anchor registry
  address internal anchorRegistry_;

  // array of field names that are being proved using the document root and precise-proofs
  bytes[] public mandatoryFields;

  // The ownable anchor
  struct OwnedAnchor {
    uint256 anchorId;
    bytes32 rootHash;
  }

  // Mapping from token details to token ID
  mapping(uint256 => OwnedAnchor) internal tokenDetails_;

  /**
   * @dev Gets the anchor registry's address that is backing this token
   * @return address The address of the anchor registry
   */
  function anchorRegistry()
  external
  view
  returns (address)
  {
    return anchorRegistry_;
  }

  /**
   * @dev Constructor function
   * @param _name string The name of this token
   * @param _symbol string The shorthand token identifier
   * @param _anchorRegistry address The address of the anchor registry
   * @param _mandatoryFields array of field names that are being proved
   * using document root and precise-proofs.
   * that is backing this token's mint method.
   */
  function initialize(
    string memory _name,
    string memory _symbol,
    address _anchorRegistry,
    bytes[] memory _mandatoryFields
  )
  public
  initializer
  {
    anchorRegistry_ = _anchorRegistry;
    mandatoryFields = _mandatoryFields;
    ERC721.initialize();
    ERC721Enumerable.initialize();
    ERC721Metadata.initialize(_name, _symbol);
  }

  /**
   * @dev Mints a token after validating the given merkle proof
   * and comparing it to the anchor registry's stored hash/doc ID.
   * @param _to address The recipient of the minted token
   * @param _tokenId uint256 The ID for the minted token
   * @param _anchorId bytes32 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param _merkleRoot bytes32 The root hash of the merkle proof/doc
   * @param _tokenURI string The metadata uri
   * @param _values bytes[] The values of the leafs that are being proved
   * using precise-proofs
   * @param _salts bytes32[] The salts for the field that is being proved
   * Will be concatenated for proof verification as outlined in
   * precise-proofs library.
   * @param _proofs bytes32[][] Documents proofs that are needed
   * for proof verification as outlined in precise-proofs library.
   */
  function _mintAnchor(
    address _to,
    uint256 _tokenId,
    uint256 _anchorId,
    bytes32 _merkleRoot,
    string memory _tokenURI,
    bytes[] memory _values,
    bytes32[] memory _salts,
    bytes32[][] memory _proofs
  )
  internal
  {

    for (uint i = 0; i < mandatoryFields.length; i++) {
      require(
        MerkleProof.verifySha256(
          _proofs[i],
          _merkleRoot,
          sha256(abi.encodePacked(mandatoryFields[i], _values[i], _salts[i]))
        ),
        "Mandatory field failed"
      );
    }

    super._mint(_to, _tokenId);
    tokenDetails_[_tokenId] = OwnedAnchor(_anchorId, _merkleRoot);
    _setTokenURI(_tokenId, _tokenURI);
  }

  /**
   * @dev Address getter. This is need in order to be able to override
   * the return value in testing Mock for precise proof testing
   * @return address the address of the contact
   */
  function _getOwnAddress()
  internal
  view
  returns (address)
  {
    return address(this);
  }

  /**
   * @dev Retrieve the document root from the linked
   * anchor registry for the given id.
   * @param _anchorId bytes32 The ID of the document as identified
   * @return The anchored documentRoot
   */
  function _getDocumentRoot(
    uint256 _anchorId
  )
  internal
  view
  returns (bytes32 documentRoot)
  {
    AnchorRepository ar = AnchorRepository(anchorRegistry_);
    (, bytes32 merkleRoot) = ar.getAnchorById(_anchorId);
    require(
      merkleRoot != 0x0,
      "Document in not anchored in the registry"
    );

    return merkleRoot;
  }


  /**
   * @dev Checks if the provided next id is part of the
   * document root using precise-proofs and it's not anchored
   * in the registry
   * @param _documentRoot bytes32 the anchored document root
   * @param _nextAnchorId uint256 the next id to be anchored
   * @param _salt bytes32 salt for leaf construction
   * @param _proof bytes32[] proofs for _nextAnchorId
   */
  function _requireIsLatestDocumentVersion(
    bytes32 _documentRoot,
    uint256 _nextAnchorId,
    bytes32 _salt,
    bytes32[] memory _proof
  )
  internal
  view
  {
    AnchorRepository ar = AnchorRepository(anchorRegistry_);
    (, bytes32 nextMerkleRoot) = ar.getAnchorById(_nextAnchorId);

    require(
      nextMerkleRoot == 0x0,
      "Document has a newer version on chain"
    );

    require(
      MerkleProof.verifySha256(
        _proof,
        _documentRoot,
        sha256(
          abi.encodePacked(
            hex"00000004", // compact prop for "next_version"
            _nextAnchorId,
            _salt
          )
        )
      ),
      "Next version proof is not valid"
    );

  }
  /**
   * @dev Checks that the document has no other token
   * minted in this registry for the provided document
   * @param _documentRoot bytes32 the anchored document root
   * @param _tokenId uint256 The ID for the token to be minted
   * @param _salt bytes32 salt for leaf construction
   * @param _proof bytes32[] proofs for _nextAnchorId
   */
  function _requireOneTokenPerDocument(
    bytes32 _documentRoot,
    uint256 _tokenId,
    bytes32 _salt,
    bytes32[] memory _proof
  )
  internal
  view
  {
    // Reconstruct the property
    // the property format: nfts[registryAddress]
    bytes memory property = abi.encodePacked(
      hex"00000014", // compact prop from "nfts"
      _getOwnAddress(),
      hex"000000000000000000000000" // precise proofs generates a bytes32 hex
    );
    require(
      MerkleProof.verifySha256(
        _proof,
        _documentRoot,
        sha256(abi.encodePacked(property, _tokenId, _salt))
      ),
      "Token uniqueness proof is not valid"
    );

  }

  /**
   * @dev Checks that the document has a read rule set
   * using precise proofs and extract the index of the role
   * @param _documentRoot bytes32 the anchored document root
   * @param _property bytes property for leaf construction
   * @param _value bytes value for leaf construction
   * @param _salt bytes32 salt for leaf construction
   * @param _proof bytes32[] proofs for _nextAnchorId
   * @return bytes8 the index of the read rule
   */
  function _requireReadRole(
    bytes32 _documentRoot,
    bytes memory _property,
    bytes memory _value,
    bytes32 _salt,
    bytes32[] memory _proof
  )
  internal
  pure
  returns (bytes8 readRuleIndex)
  {
    // Extract the indexes
    readRuleIndex = extractIndex(_property, 4);
    bytes8 readRuleRoleIndex = extractIndex(_property, 16);
    // Reconstruct the property
    // the property format: read_rules[readRuleIndex].roles[readRuleRoleIndex]
    bytes memory property = abi.encodePacked(
      hex"00000013", // compact prop for "read_rules"
      readRuleIndex,
      hex"00000002", // compact prop for "roles"
      readRuleRoleIndex
    );

    require(
      MerkleProof.verifySha256(
        _proof,
        _documentRoot,
        sha256(
          abi.encodePacked(
            property,
            _value,
            _salt
          )
        )
      ),
      "Read Rule proof is not valid"
    );

    return readRuleIndex;
  }

  /**
   * @dev Checks that the document has a read action set
   * to the read role using precise proofs
   * @param _documentRoot bytes32 the anchored document root
   * @param _readRuleIndex bytes8 read rule index used for leaf construction
   * @param _salt bytes32 salt for leaf construction
   * @param _proof bytes32[] proofs for _nextAnchorId
   */
  function _requireReadAction(
    bytes32 _documentRoot,
    bytes8 _readRuleIndex,
    bytes32 _salt,
    bytes32[] memory _proof
  )
  internal
  pure
  {
    // Reconstruct the property
    // the property format: read_rules[_readRuleIndex].action
    bytes memory property = abi.encodePacked(
      hex"00000013", // compact prop for "read_rules"
      _readRuleIndex,
      hex"00000004" // compact prop for "action"
    );

    require(
      MerkleProof.verifySha256(
        _proof,
        _documentRoot,
        sha256(
          abi.encodePacked(
            property,
            hex"0000000000000001", // Read action value has to be 1
            _salt
          )
        )
      ),
      "Read Action is not valid"
    );
  }

  /**
   * @dev Checks that provided document read role is assigned to the
   * token to me minted
   * @param _documentRoot bytes32 the anchored document root
   * @param _tokenId uint256 The ID for the minted token
   * @param _property bytes property for leaf construction
   * @param _roleIndex bytes the value of the defined read role
   * used to contract the property for precise proofs
   * @param _salt bytes32 salt for leaf construction
   * @param _proof bytes32[] proofs for _nextAnchorId
   */
  function _requireTokenHasRole(
    bytes32 _documentRoot,
    uint256 _tokenId,
    bytes memory _property,
    bytes memory _roleIndex,
    bytes32 _salt,
    bytes32[] memory _proof
  )
  internal
  view
  {
    // Extract the token index
    bytes8 tokenIndex = extractIndex(_property, 40);
    // Reconstruct the property
    // the property format: roles[roleIndex].nfts[tokenIndex]
    bytes memory property = abi.encodePacked(
      hex"00000001", // compact prop for "roles"
      _roleIndex,
      hex"00000004", // compact prop for "nfts"
      tokenIndex
    );
    // Reconstruct the value
    bytes memory value = abi.encodePacked(
      _getOwnAddress(),
      _tokenId
    );

    require(
      MerkleProof.verifySha256(
        _proof,
        _documentRoot,
        sha256(abi.encodePacked(property, value, _salt))
      ),
      "Token Role not valid"
    );
  }

  /**
   * @dev Parses bytes and extract a bytes8 value from
   * the given starting point
   * @param _bytes bytes the parse to extract value from
   * @param _startFrom uint256 where to start from
   * @return bytes8 the index found, it defaults to 0x00000000000000
   */
  function extractIndex(
    bytes memory _bytes,
    uint256 _startFrom
  )
  internal
  pure
  returns (
    bytes8 index
  )
  {
    bytes8 temp;
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      temp := mload(add(add(_bytes, 0x20), _startFrom))
    }

    return temp;
  }


}
