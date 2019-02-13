pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721Metadata.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721Enumerable.sol";
import "contracts/AnchorRepository.sol";
import "contracts/lib/MerkleProof.sol";


contract UserMintableERC721 is Initializable, ERC721,ERC721Enumerable, ERC721Metadata {
  // anchor registry
  address internal anchorRegistry_;

  // array of field names that are being proved using the document root and precise-proofs
  string[] public mandatoryFields;

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
    string[] memory _mandatoryFields
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
   * @dev Retrieve the register document Root and validate if it's the latest version
   * anchor registry of this contract with the given root hash.
   * @param _anchorId bytes32 The ID of the document as identified
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
   * @dev Validate if it's the latest version
   * anchor registry of this contract with the given root hash.
   * @param _documentRoot bytes32 the anchored document root
   * @param _nextAnchorId string the next id to be anchored for a document change
   * by the set up anchorRegistry.
   * @param _salt bytes32 salt for leaf construction
   * @param _proof bytes32[] proofs for _nextAnchorId
   */
  function _isLatestDocumentVersion(
    bytes32 _documentRoot,
    string memory _nextAnchorId,
    bytes32 _salt,
    bytes32[] memory _proof
  )
  internal
  view
  returns(uint nextAnchorId)
  {
    AnchorRepository ar = AnchorRepository(anchorRegistry_);

    nextAnchorId = parseInt(_nextAnchorId);
    (,bytes32 nextMerkleRoot) = ar.getAnchorById(nextAnchorId);

    require(
      nextMerkleRoot == 0x0,
      "Document has a newer version on chain"
    );

    require(
      MerkleProof.verifySha256(
        _proof,
        _documentRoot,
        _hashLeafData("next_version", _nextAnchorId, _salt)
      ),
      "Next version proof is not valid"
    );

    return nextAnchorId;
  }

  /**
   * @dev Hashes a leaf's data according to precise-proof leaf
   * concatenation rules. Using keccak256 hashing.
   * @param _leafName string The leaf's name that is being proved
   * @param _leafValue string The leaf's value that is being proved
   * @param _leafSalt bytes32 The leaf's that is being proved
   * @return byte32 keccak256 hash of the concatenated plain-text values
   */
  function _hashLeafData(
    string memory _leafName,
    string memory _leafValue,
    bytes32 _leafSalt
  )
  internal
  pure
  returns (bytes32)
  {
    return sha256(abi.encodePacked(_leafName, _leafValue, _leafSalt));
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
   * @param _values string[] The values of the leafs that are being proved
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
    string[] memory _values,
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
          _hashLeafData(mandatoryFields[i], _values[i], _salts[i])
        ),
        mandatoryFields[i]
      );
    }

    super._mint(_to, _tokenId);
    tokenDetails_[_tokenId] = OwnedAnchor(_anchorId, _merkleRoot);
    _setTokenURI(_tokenId, _tokenURI);
  }



  //TODO remove all this functions when values in bytes. next_version seems to contain decimal values.

  function parseInt(string memory _a) internal pure returns (uint _parsedInt) {
    return parseInt(_a, 0);
  }

  function parseInt(string memory _a, uint _b) internal pure returns (uint _parsedInt) {
    bytes memory bresult = bytes(_a);
    uint mint = 0;
    bool decimals = false;
    for (uint i = 0; i < bresult.length; i++) {
      if ((uint(uint8(bresult[i])) >= 48) && (uint(uint8(bresult[i])) <= 57)) {
        if (decimals) {
          if (_b == 0) {
            break;
          } else {
            _b--;
          }
        }
        mint *= 10;
        mint += uint(uint8(bresult[i])) - 48;
      } else if (uint(uint8(bresult[i])) == 46) {
        decimals = true;
      }
    }
    if (_b > 0) {
      mint *= 10 ** _b;
    }
    return mint;
  }

  function strConcat(string memory _a, string memory _b) internal pure returns (string memory _concatenatedString) {
    return strConcat(_a, _b, "", "", "");
  }

  function strConcat(string memory _a, string memory _b, string memory _c) internal pure returns (string memory _concatenatedString) {
    return strConcat(_a, _b, _c, "", "");
  }

  function strConcat(string memory _a, string memory _b, string memory _c, string memory _d) internal pure returns (string memory _concatenatedString) {
    return strConcat(_a, _b, _c, _d, "");
  }

  function strConcat(string memory _a, string memory _b, string memory _c, string memory _d, string memory _e) internal pure returns (string memory _concatenatedString) {
    bytes memory _ba = bytes(_a);
    bytes memory _bb = bytes(_b);
    bytes memory _bc = bytes(_c);
    bytes memory _bd = bytes(_d);
    bytes memory _be = bytes(_e);
    string memory abcde = new string(_ba.length + _bb.length + _bc.length + _bd.length + _be.length);
    bytes memory babcde = bytes(abcde);
    uint k = 0;
    uint i = 0;
    for (i = 0; i < _ba.length; i++) {
      babcde[k++] = _ba[i];
    }
    for (i = 0; i < _bb.length; i++) {
      babcde[k++] = _bb[i];
    }
    for (i = 0; i < _bc.length; i++) {
      babcde[k++] = _bc[i];
    }
    for (i = 0; i < _bd.length; i++) {
      babcde[k++] = _bd[i];
    }
    for (i = 0; i < _be.length; i++) {
      babcde[k++] = _be[i];
    }
    return string(babcde);
  }


}
