pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721Metadata.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721Enumerable.sol";
import "contracts/AnchorRepository.sol";
import "contracts/IdentityFactory.sol";
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
  address internal _anchorRegistry;
  // identity factory
  address internal _identityFactory;

  // array of field names that are being proved using the document root and precise-proofs
  bytes[] private _mandatoryFields;

  // The ownable anchor
  struct OwnedAnchor {
    uint256 anchorId;
    bytes32 rootHash;
  }

  // Mapping from token details to token ID
  mapping(uint256 => OwnedAnchor) internal _tokenDetails;

  /**
   * @dev Gets the anchor registry's address that is backing this token
   * @return address The address of the anchor registry
   */
  function getAnchorRegistry()
  external
  view
  returns (address)
  {
    return _anchorRegistry;
  }

  /**
   * @dev Gets the identity factory's address that is used to validate centrifuge identities
   * @return address The address of the identity registry
   */
  function getIdentityFactory()
  external
  view
  returns (address)
  {
    return _identityFactory;
  }

  /**
   * @dev Constructor function
   * @param name string The name of this token
   * @param symbol string The shorthand token identifier
   * @param anchorRegistry address The address of the anchor registry
   * @param identityFactory address The address of the identity factory
   * @param mandatoryFields array of field names that are being proved
   * using document root and precise-proofs.
   * that is backing this token's mint method.
   */
  function initialize(
    string memory name,
    string memory symbol,
    address anchorRegistry,
    address identityFactory,
    bytes[] memory mandatoryFields
  )
  public
  initializer
  {
    _anchorRegistry = anchorRegistry;
    _identityFactory = identityFactory;
    _mandatoryFields = mandatoryFields;

    ERC721.initialize();
    ERC721Enumerable.initialize();
    ERC721Metadata.initialize(name, symbol);
  }

  /**
   * @dev Mints a token after validating the given merkle proof
   * and comparing it to the anchor registry's stored hash/doc ID.
   * @param to address The recipient of the minted token
   * @param tokenId uint256 The ID for the minted token
   * @param anchorId bytes32 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param merkleRoot bytes32 The root hash of the merkle proof/doc
   * @param tokenURI string The metadata uri
   * @param values bytes[] The values of the leafs that are being proved
   * using precise-proofs
   * @param salts bytes32[] The salts for the field that is being proved
   * Will be concatenated for proof verification as outlined in
   * precise-proofs library.
   * @param proofs bytes32[][] Documents proofs that are needed
   * for proof verification as outlined in precise-proofs library.
   */
  function _mintAnchor(
    address to,
    uint256 tokenId,
    uint256 anchorId,
    bytes32 merkleRoot,
    string memory tokenURI,
    bytes[] memory values,
    bytes32[] memory salts,
    bytes32[][] memory proofs
  )
  internal
  {

    for (uint i = 0; i < _mandatoryFields.length; i++) {
      require(
        MerkleProof.verifySha256(
          proofs[i],
          merkleRoot,
          sha256(abi.encodePacked(_mandatoryFields[i], values[i], salts[i]))
        ),
        "Mandatory field failed"
      );
    }

    super._mint(to, tokenId);
    _tokenDetails[tokenId] = OwnedAnchor(anchorId, merkleRoot);
    _setTokenURI(tokenId, tokenURI);
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
   * @param anchorId bytes32 The ID of the document as identified
   * @return The anchored documentRoot
   */
  function _getDocumentRoot(
    uint256 anchorId
  )
  internal
  view
  returns (bytes32 documentRoot)
  {
    AnchorRepository ar_ = AnchorRepository(_anchorRegistry);
    (, bytes32 merkleRoot_) = ar_.getAnchorById(anchorId);
    require(
      merkleRoot_ != 0x0,
      "Document in not anchored in the registry"
    );

    return merkleRoot_;
  }

  /**
   * @dev Checks if the provided proof is part of the document root,
   * convert the value to address check if it was created
   * using the linked identity factory
   * @param documentRoot bytes32 the anchored document root
   * @param property bytes property for leaf construction
   * @param value bytes value for leaf construction
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */
  function _requireValidIdentity(
    bytes32 documentRoot,
    bytes memory property,
    bytes memory value,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  view
  {
    require(
      MerkleProof.verifySha256(
        proof,
        documentRoot,
        sha256(
          abi.encodePacked(
            property,
            value,
            salt
          )
        )
      ),
      "Identity proof is not valid"
    );

    // Check if address was created by the identity factory
    address identity = bytesToAddress(value);
    IdentityFactory identityFactory_ = IdentityFactory(_identityFactory);
    bool valid = identityFactory_.createdIdentity(identity);
    require(
      valid,
      "Identity is not registered"
    );
  }

  /**
   * @dev Checks if the provided next id is part of the
   * document root using precise-proofs and it's not anchored
   * in the registry
   * @param documentRoot bytes32 the anchored document root
   * @param nextAnchorId uint256 the next id to be anchored
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */
  function _requireIsLatestDocumentVersion(
    bytes32 documentRoot,
    uint256 nextAnchorId,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  view
  {
    AnchorRepository ar_ = AnchorRepository(_anchorRegistry);
    (, bytes32 nextMerkleRoot_) = ar_.getAnchorById(nextAnchorId);

    require(
      nextMerkleRoot_ == 0x0,
      "Document has a newer version on chain"
    );

    require(
      MerkleProof.verifySha256(
        proof,
        documentRoot,
        sha256(
          abi.encodePacked(
            hex"0100000000000004", // compact prop for "next_version"
            nextAnchorId,
            salt
          )
        )
      ),
      "Next version proof is not valid"
    );

  }
  /**
   * @dev Checks that the document has no other token
   * minted in this registry for the provided document
   * @param documentRoot bytes32 the anchored document root
   * @param tokenId uint256 The ID for the token to be minted
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */
  function _requireOneTokenPerDocument(
    bytes32 documentRoot,
    uint256 tokenId,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  view
  {
    // Reconstruct the property
    // the property format: nfts[registryAddress]
    bytes memory property_ = abi.encodePacked(
      hex"0100000000000014", // compact prop from "nfts"
      _getOwnAddress(),
      hex"000000000000000000000000" // precise proofs generates a bytes32 hex
    );
    require(
      MerkleProof.verifySha256(
        proof,
        documentRoot,
        sha256(abi.encodePacked(property_, tokenId, salt))
      ),
      "Token uniqueness proof is not valid"
    );

  }

  /**
   * @dev Checks that the document has a read rule set
   * using precise proofs and extract the index of the role
   * @param documentRoot bytes32 the anchored document root
   * @param property bytes property for leaf construction
   * @param value bytes value for leaf construction
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   * @return bytes8 the index of the read rule
   */
  function _requireReadRole(
    bytes32 documentRoot,
    bytes memory property,
    bytes memory value,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  pure
  returns (bytes8 readRuleIndex)
  {
    // Extract the indexes
    bytes8 readRuleIndex_ = extractIndex(property, 8);
    bytes8 readRuleRoleIndex_ = extractIndex(property, 20);
    // Reconstruct the property
    // the property format: read_rules[readRuleIndex].roles[readRuleRoleIndex]
    bytes memory property_ = abi.encodePacked(
      hex"0100000000000013", // compact prop for "read_rules"
      readRuleIndex_,
      hex"00000002", // compact prop for "roles"
      readRuleRoleIndex_
    );

    require(
      MerkleProof.verifySha256(
        proof,
        documentRoot,
        sha256(
          abi.encodePacked(
            property_,
            value,
            salt
          )
        )
      ),
      "Read Rule proof is not valid"
    );

    return readRuleIndex_;
  }

  /**
   * @dev Checks that the document has a read action set
   * to the read role using precise proofs
   * @param documentRoot bytes32 the anchored document root
   * @param readRuleIndex bytes8 read rule index used for leaf construction
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */
  function _requireReadAction(
    bytes32 documentRoot,
    bytes8 readRuleIndex,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  pure
  {
    // Reconstruct the property
    // the property format: read_rules[readRuleIndex].action
    bytes memory property_ = abi.encodePacked(
      hex"0100000000000013", // compact prop for "read_rules"
      readRuleIndex,
      hex"00000004" // compact prop for "action"
    );

    require(
      MerkleProof.verifySha256(
        proof,
        documentRoot,
        sha256(
          abi.encodePacked(
            property_,
            hex"0000000000000001", // Read action value has to be 1
            salt
          )
        )
      ),
      "Read Action is not valid"
    );
  }

  /**
   * @dev Checks that provided document read role is assigned to the
   * token to me minted
   * @param documentRoot bytes32 the anchored document root
   * @param tokenId uint256 The ID for the minted token
   * @param property bytes property for leaf construction
   * @param roleIndex bytes the value of the defined read role
   * used to contract the property for precise proofs
   * @param salt bytes32 salt for leaf construction
   * @param proof bytes32[] proofs for leaf construction
   */
  function _requireTokenHasRole(
    bytes32 documentRoot,
    uint256 tokenId,
    bytes memory property,
    bytes memory roleIndex,
    bytes32 salt,
    bytes32[] memory proof
  )
  internal
  view
  {
    // Extract the token index
    bytes8 tokenIndex_ = extractIndex(property, 44);
    // Reconstruct the property
    // the property format: roles[roleIndex].nfts[tokenIndex]
    bytes memory property_ = abi.encodePacked(
      hex"0100000000000001", // compact prop for "roles"
      roleIndex,
      hex"00000004", // compact prop for "nfts"
      tokenIndex_
    );
    // Reconstruct the value
    bytes memory value_ = abi.encodePacked(
      _getOwnAddress(),
      tokenId
    );

    require(
      MerkleProof.verifySha256(
        proof,
        documentRoot,
        sha256(abi.encodePacked(property_, value_, salt))
      ),
      "Token Role not valid"
    );
  }

  /**
   * @dev Parses bytes and extracts a bytes8 value from
   * the given starting point
   * @param payload bytes From where to extract the index
   * @param startFrom uint256 where to start from
   * @return bytes8 the index found, it defaults to 0x00000000000000
   */
  function extractIndex(
    bytes memory payload,
    uint256 startFrom
  )
  internal
  pure
  returns (
    bytes8 index
  )
  {
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      index := mload(add(add(payload, 0x20), startFrom))
    }
  }

  /**
   * @dev Parses bytes and extracts a address value
   * @param payload bytes From where to extract the index
   * @return address the converted address
   */
  function bytesToAddress(
    bytes memory payload
  )
  internal
  pure
  returns(
    address addr
  )
  {
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      addr := mload(add(payload, 20))
    }
  }


}
