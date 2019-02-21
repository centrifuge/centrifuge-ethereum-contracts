pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "contracts/lib/MerkleProof.sol";
import "contracts/erc721/UserMintableERC721.sol";
import "contracts/Identity.sol";


contract PaymentObligation is Initializable, UserMintableERC721 {

  event PaymentObligationMinted(
    address to,
    uint256 tokenId,
    string tokenURI
  );

  // hardcoded supported fields for minting a PaymentObligation
  bytes[] public mandatoryFields_;

  struct PODetails {
    bytes grossAmount;
    bytes currency;
    bytes dueDate;
  }

  mapping(uint256 => PODetails) internal poDetails_;

  /**
  * @dev Returns the values associated with a token
  * @param grossAmount bytes The gross amount of the invoice
  * @param currency bytes The currency used in the invoice
  * @param dueDate bytes The Due data of the invoice
  * @param anchorId uint256 The ID of the document as identified
  * by the set up anchorRegistry
  * @param documentRoot bytes32 The root hash of the merkle proof/doc
  */
  function getTokenDetails(uint256 _tokenId)
  external
  view
  returns (
    bytes memory grossAmount,
    bytes memory currency,
    bytes memory dueDate,
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


  /**
   * @param _anchorRegistry address The address of the anchor registry
   * that is backing this token's mint method.
   * that ensures that the sender is authorized to mint the token
   */
  function initialize(
    address _anchorRegistry
  )
  public
  initializer
  {
    mandatoryFields_.push(hex"010000000000000e"); //"invoice.gross_amount",
    mandatoryFields_.push(hex"010000000000000d"); //invoice.currency
    mandatoryFields_.push(hex"0100000000000016"); // invoice.due_date

    UserMintableERC721.initialize(
      "Centrifuge Payment Obligations",
      "CENT_PAY_OB",
      _anchorRegistry,
      mandatoryFields_
    );
  }

  /**
   * @dev Mints a token after validating the given merkle proof
   * and comparing it to the anchor registry's stored hash/doc ID.
   * @param _to address The recipient of the minted token
   * @param _tokenId uint256 The ID for the minted token
   * @param _tokenURI string The metadata uri
   * @param _anchorId uint256 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param _nextAnchorId uint256 The id that will be anchored when a change
   * is made to the document
   * @param _properties bytes[] The properties of the leafs that are being proved
   * using precise-proofs
   * @param _values bytes[] The values of the leafs that are being proved
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
    string memory _tokenURI,
    uint256 _anchorId,
    uint256 _nextAnchorId,
    bytes[] memory _properties,
    bytes[] memory _values,
    bytes32[] memory _salts,
    bytes32[][] memory _proofs
  )
  public
  {
    // Get the document root from AnchorRepository
    bytes32 merkleRoot = super._getDocumentRoot(
      _anchorId
    );

    // Enforce that there is not a newer version of the document on chain
    super._isLatestDocumentVersion(
      merkleRoot,
      _nextAnchorId,
      _salts[3],
      _proofs[3]
    );

    // Verify that only one token per document/registry is minted
    super._oneTokenPerDocument(
      merkleRoot,
      _tokenId,
      _salts[4],
      _proofs[4]
    );

    // Check if document has a read rule defined
    bytes8 readRoleIndex = super._hasReadRole(
      merkleRoot,
      _properties[0],
      _values[3],
      _salts[5],
      _proofs[5]
    );

    // Check if the read rule has a read action
    super._hasReadAction(
      merkleRoot,
      readRoleIndex,
      _salts[6],
      _proofs[6]
    );

    // Check if the token has the read role assigned to it
    super._tokenHasRole(
      merkleRoot,
      _tokenId,
      _properties[1],
      _values[3], // the value from read role proof
      _salts[7],
      _proofs[7]
    );

    super._mintAnchor(
      _to,
      _tokenId,
      _anchorId,
      merkleRoot,
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

}

