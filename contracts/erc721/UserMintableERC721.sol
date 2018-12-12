pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721Metadata.sol";
import "openzeppelin-eth/contracts/token/ERC721/ERC721.sol";
import "contracts/AnchorRepository.sol";
import "contracts/lib/MerkleProofSha256.sol";


contract UserMintableERC721 is Initializable, ERC721, ERC721Metadata {
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
    string _name,
    string _symbol,
    address _anchorRegistry,
    string[] _mandatoryFields
  )
  public
  initializer
  {
    anchorRegistry_ = _anchorRegistry;
    mandatoryFields = _mandatoryFields;
    ERC721.initialize();
    ERC721Metadata.initialize(_name, _symbol);
  }

  /**
   * @dev Checks if a given document is registered in the the
   * anchor registry of this contract with the given root hash.
   * @param _anchorId bytes32 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param _merkleRoot bytes32 The root hash of the merkle proof/doc
   */
  function _isValidAnchor(
    uint256 _anchorId,
    bytes32 _merkleRoot
  )
  internal
  view
  returns (bool)
  {
    AnchorRepository ar = AnchorRepository(anchorRegistry_);

    (uint256 identifier, bytes32 merkleRoot) = ar.getAnchorById(_anchorId);

    if (
      identifier != 0x0 &&
      _anchorId == identifier && merkleRoot != 0x0 && _merkleRoot == merkleRoot
    ) {
      return true;
    }
    return false;
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
    string _leafName,
    string _leafValue,
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
    string _tokenURI,
    string[] _values,
    bytes32[] _salts,
    bytes32[][] _proofs
  )
  internal
  {

    require(
      _isValidAnchor(_anchorId, _merkleRoot),
      "document needs to be registered in registry"
    );

    for (uint i = 0; i < mandatoryFields.length; i++) {
      require(
        MerkleProofSha256.verifyProof(
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


}
