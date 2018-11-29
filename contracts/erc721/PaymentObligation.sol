pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "contracts/lib/MerkleProofSha256.sol";
import "contracts/erc721/UserMintableERC721.sol";
import "contracts/Identity.sol";


contract PaymentObligation is UserMintableERC721 {

  event PaymentObligationMinted(
    address to,
    uint256 tokenId,
    string tokenURI
  );

  // hardcoded supported fields for minting a PaymentObligation
  string[] internal mandatoryFields_ = [
    "invoice.gross_amount",
    "invoice.currency",
    "invoice.due_date",
    "collaborators[0]" // owner of the document
  ];

  struct PODetails {
    string grossAmount;
    string currency;
    string dueDate;
  }

  mapping(uint256 => PODetails) internal poDetails_;

  /**
   * @dev Constructor function
   * @param _anchorRegistry address The address of the anchor registry
   * that is backing this token's mint method.
   * that ensures that the sender is authorized to mint the token
   */
  constructor(
    address _anchorRegistry
  )
  UserMintableERC721("Centrifuge Payment Obligations", "CENT_PAY_OB", _anchorRegistry, mandatoryFields_)
  public
  {
  }

  /**
   * @dev Mints a token after validating the given merkle proof
   * and comparing it to the anchor registry's stored hash/doc ID.
   * @param _to address The recipient of the minted token
   * @param _tokenId uint256 The ID for the minted token
   * @param _tokenURI string The metadata uri
   * @param _anchorId bytes32 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param _merkleRoot bytes32 The root hash of the merkle proof/doc
   * It needs to start with a collaborator prefix, ex: collaborator[0]
   * @param _values string[] The values of the leafs that are being proved
   * using precise-proofs
   * @param _salts bytes32[] The salts for the field that is being proved
   * Will be concatenated for proof verification as outlined in
   * precise-proofs library.
   * @param _proofs bytes32[][] Documents proofs that are needed
   * for proof verification as outlined in precise-proofs library.
   */
  function mint(
    address _to,
    uint256 _tokenId,
    string _tokenURI,
    uint256 _anchorId,
    bytes32 _merkleRoot,
    string[] _values,
    bytes32[] _salts,
    bytes32[][] _proofs
  )
  public
  {

    // TODO handle colaborator validation against centrifuge identity
    super._mintAnchor(
      _to,
      _tokenId,
      _anchorId,
      _merkleRoot,
      _tokenURI,
      _values,
      _salts,
      _proofs
    );

    // Store fields values
    // use the anchorId as a key in order to prevent double minting
    // for the same anchor and save storage
    poDetails_[_anchorId] = PODetails(
      _values[0],
      _values[1],
      _values[2]
    );

    emit PaymentObligationMinted(
      _to,
      _tokenId,
      _tokenURI
    );
  }

  /**
  * Returns the values associated with a token
  * @param grossAmount string The gross amount of the invoice
  * @param currency string The currency used in the invoice
  * @param dueDate string The Due data of the invoice
  * @param anchorId uint256 The ID of the document as identified
  * by the set up anchorRegistry
  * @param documentRoot bytes32 The root hash of the merkle proof/doc
  */
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

