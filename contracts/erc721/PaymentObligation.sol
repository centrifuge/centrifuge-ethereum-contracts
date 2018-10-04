pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "contracts/lib/MerkleProofSha256.sol";
import "contracts/erc721/UserMintableERC721.sol";


contract PaymentObligation is UserMintableERC721 {

  event PaymentObligationMinted(
    address to,
    uint256 tokenId,
    string tokenURI
  );

  // anchor registry
  address internal identityRegistry_;

  string[3] internal supportedFields_ = ["gross_amount", "currency", "due_date"];

  struct PODetails {
    string grossAmount;
    string currency;
    string dueDate;
  }

  struct Field {
    string value;
    bytes32 salt;
    bytes32[] proof;
  }

  mapping(uint256 => PODetails) internal poDetails_;

  /**
   * @dev Constructor function
   * @param _name string The name of this token
   * @param _symbol string The shorthand token identifier
   * @param _anchorRegistry address The address of the anchor registry
   * that is backing this token's mint method.
   */
  constructor(
    string _name,
    string _symbol,
    address _anchorRegistry,
    address _identityRegistry
  )
  UserMintableERC721(_name, _symbol, _anchorRegistry)
  public
  {
    identityRegistry_ = _identityRegistry;
  }

  // TODO add document type and prove that the sender is a collaborator
  /**
   * @dev Mints a token after validating the given merkle proof
   * and comparing it to the anchor registry's stored hash/doc ID.
   * @param _to address The recipient of the minted token
   * @param _tokenId uint256 The ID for the minted token
   * @param _tokenURI string The metadata uri
   * @param _anchorId bytes32 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param _merkleRoot bytes32 The root hash of the merkle proof/doc
   * @param _documentFields Field[3] Documents fields that are needed
   * for proof verification as outlined in precise-proofs library.
   */
  function mint(
    address _to,
    uint256 _tokenId,
    string _tokenURI,
    uint256 _anchorId,
    bytes32 _merkleRoot,
    Field[3] _documentFields
  )
  public
  {
    require(
      bytes(poDetails_[_anchorId].grossAmount).length == 0,
      "anchor id already has a minted nft"
    );

    require(
      MerkleProofSha256.verifyProof(
        _documentFields[0].proof,
        _merkleRoot,
        _hashLeafData(supportedFields_[0], _documentFields[0].value, _documentFields[0].salt)
      ),
      "merkle tree needs to validate gross_amount"
    );

    require(
      MerkleProofSha256.verifyProof(
        _documentFields[1].proof,
        _merkleRoot,
        _hashLeafData(supportedFields_[1], _documentFields[1].value, _documentFields[1].salt)
      ),
      "merkle tree needs to validate currency"
    );

    require(
      MerkleProofSha256.verifyProof(
        _documentFields[2].proof,
        _merkleRoot,
        _hashLeafData(supportedFields_[2], _documentFields[2].value, _documentFields[2].salt)
      ),
      "merkle tree needs to validate due_date"
    );

    super._mintAnchor(
      _to,
      _tokenId,
      _anchorId,
      _merkleRoot,
      _tokenURI
    );

    // Store fields values
    // use the anchorId as a key in order to enforce double minting
    // for the same anchor and save storage
    // the tokenId is enforced in tokenDetails_ mapping
    poDetails_[_anchorId] = PODetails(
      _documentFields[0].value,
      _documentFields[1].value,
      _documentFields[2].value);

    emit PaymentObligationMinted(
      _to,
      _tokenId,
      _tokenURI
    );
  }


  function getTokenDetails(uint256 _tokenId)
  public
  view
  returns (
    string grossAmount,
    string currency,
    string dueDate,
    uint256 anchorId,
    bytes32 documentRoot
  )
  {
    anchorId = tokenDetails_[_tokenId].anchorId;

    return (
    poDetails_[anchorId].grossAmount,
    poDetails_[anchorId].currency,
    poDetails_[anchorId].dueDate,
    anchorId,
    tokenDetails_[_tokenId].rootHash
    );
  }

}

