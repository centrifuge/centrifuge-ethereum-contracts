pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "contracts/erc721/UserMintableERC721.sol";
import "contracts/Identity.sol";


contract InvoiceUnpaidNFT is Initializable, UserMintableERC721 {

  event InvoiceUnpaidMinted(
    address to,
    uint256 tokenId
  );

  struct TokenDetails {
    address invoiceSender;
    bytes grossAmount;
    bytes currency;
    bytes dueDate;
    uint256 anchorId;
    uint256 nextAnchorId;
    bytes32 documentRoot;
  }

  /** @dev Indexes of the mint method arrays
  */
  uint8 constant internal GROSS_AMOUNT_IDX = 0;
  uint8 constant internal CURRENCY_IDX = 1;
  uint8 constant internal DUE_DATE_IDX = 2;
  uint8 constant internal SENDER_IDX = 3;
  uint8 constant internal STATUS_IDX = 4;
  uint8 constant internal SIGNING_ROOT_IDX = 5;
  uint8 constant internal SIGNATURE_IDX = 6;
  uint8 constant internal NEXT_VERSION_IDX = 7;
  uint8 constant internal NFT_UNIQUE_IDX = 8;
  uint8 constant internal READ_ROLE_IDX = 9;
  uint8 constant internal READ_ROLE_ACTION_IDX = 10;
  uint8 constant internal TOKEN_ROLE_IDX = 11;

  // Token details, specific field values
  mapping(uint256 => TokenDetails) internal _tokenDetails;

  /**
  * @dev Returns the values associated with a token
  * @param tokenId uint256 the id for the token
  * @return invoiceSender address The identity which created the invoice and minted the nft
  * @return grossAmount bytes The gross amount of the invoice
  * @return currency bytes The currency used in the invoice
  * @return dueDate bytes The Due data of the invoice
  * @return anchorId uint256 The ID of the document as identified
  * by the set up anchorRegistry
  * @return nextAnchorId uint256 The next ID of the document in case of an update
  * @return documentRoot bytes32 The root hash of the merkle proof/doc
  */
  function getTokenDetails(
    uint256 tokenId
  )
  external
  view
  returns (
    address invoiceSender,
    bytes memory grossAmount,
    bytes memory currency,
    bytes memory dueDate,
    uint256 anchorId,
    uint256 nextAnchorId,
    bytes32 documentRoot
  )
  {
    return (
      _tokenDetails[tokenId].invoiceSender,
      _tokenDetails[tokenId].grossAmount,
      _tokenDetails[tokenId].currency,
      _tokenDetails[tokenId].dueDate,
      _tokenDetails[tokenId].anchorId,
      _tokenDetails[tokenId].nextAnchorId,
      _tokenDetails[tokenId].documentRoot
    );
  }

  /**
  * @dev Check if the given token has an anchored next version
  * @param tokenId uint256 the id for the token
  * @return bool
  */
  function isTokenLatestDocument(
    uint256 tokenId
  )
  external
  view
  returns (
    bool
  )
  {

    uint256 nextAnchorId_ = _tokenDetails[tokenId].nextAnchorId;
    if (nextAnchorId_ == 0x0)
      return false;

    AnchorRepository ar_ = AnchorRepository(_anchorRegistry);
    (, bytes32 nextDocumentRoot_, ) = ar_.getAnchorById(nextAnchorId_);
    return  nextDocumentRoot_ == 0x0;
  }


  /**
   * @param tokenUriBase string base for constructing token uris. It must end with /
   * @param anchorRegistry address The address of the anchor registry
   * @param identityFactory address The address of the identity factory
   * that is backing this token's mint method.
   * that ensures that the sender is authorized to mint the token
   */
  function initialize(
    string memory tokenUriBase,
    address anchorRegistry,
    address identityFactory
  )
  public
  initializer
  {
    //@dev Order is important. Any change will impact the mint method
    _mandatoryFields.push(INVOICE_GROSS_AMOUNT);
    _mandatoryFields.push(INVOICE_CURRENCY);
    _mandatoryFields.push(INVOICE_DUE_DATE);

    UserMintableERC721.initialize(
      "Centrifuge Unpaid Invoices",
      "CENT_INVOICE_UNPAID",
      tokenUriBase,
      anchorRegistry,
      identityFactory
    );
  }

  /**
   * @dev Mints a token after validating the given merkle proofs
   * and comparing it to the anchor registry's stored hash/doc ID.
   * @param to address The recipient of the minted token
   * @param tokenId uint256 The ID for the minted token
   * @param anchorId uint256 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param properties bytes[] The properties of the leafs that are being proved
   * using precise-proofs
   * @param values bytes[] The values of the leafs that are being proved
   * using precise-proofs
   * @param salts bytes32[] The salts for the field that is being proved
   * Will be concatenated for proof verification as outlined in
   * precise-proofs library.
   * @param proofs bytes32[][] Documents proofs that are needed
   * for proof verification as outlined in precise-proofs library.
   */
  function mint(
    address to,
    uint256 tokenId,
    uint256 anchorId,
    bytes[] memory properties,
    bytes[] memory values,
    bytes32[] memory salts,
    bytes32[][] memory proofs
  )
  public
  {
    // First check if the tokenId exists
    require(
      !_exists(tokenId),
      "Token exists"
    );

    // Get the document root from AnchorRepository
    (bytes32 documentRoot_, uint32 anchoredBlock_) = super._getDocumentRoot(
      anchorId
    );
    bytes32 signingRoot_ = bytes32(Utilities.bytesToUint(values[SIGNING_ROOT_IDX]));
    uint256 nextAnchorId_ = Utilities.bytesToUint(values[NEXT_VERSION_IDX]);

    // Check if status of invoice is unpaid
    require(
      MerkleProof.verifySha256(
        proofs[STATUS_IDX],
        signingRoot_,
        sha256(
          abi.encodePacked(
            INVOICE_STATUS, // compact property for  invoice.status, invoice = 1, status = 2
            INVOICE_STATUS_UNPAID, // bytes value for "unpaid"
            salts[STATUS_IDX]
          )
        )
      ),
      "Invoice status is not unpaid"
    );

    // Check if sender is a registered identity
    super._requireValidIdentity(
      signingRoot_,
      INVOICE_SENDER,
      _getSender(),
      salts[SENDER_IDX],
      proofs[SENDER_IDX]
    );


    // Make sure that the sender signed the document
    super._requireSignedByIdentity(
      documentRoot_,
      anchoredBlock_,
      _getSender(),
      signingRoot_,
      proofs[SIGNING_ROOT_IDX],
      values[SIGNATURE_IDX],
      salts[SIGNATURE_IDX],
      proofs[SIGNATURE_IDX]
    );

    // Enforce that there is not a newer version of the document on chain
    super._requireIsLatestDocumentVersion(
      signingRoot_,
      nextAnchorId_,
      salts[NEXT_VERSION_IDX],
      proofs[NEXT_VERSION_IDX]
    );

    // Verify that only one token per document/registry is minted
    super._requireOneTokenPerDocument(
      signingRoot_,
      tokenId,
      salts[NFT_UNIQUE_IDX],
      proofs[NFT_UNIQUE_IDX]
    );

    // Check if document has a read rule defined
    bytes8 readRoleIndex = super._requireReadRole(
      signingRoot_,
      properties[READ_ROLE_IDX],
      values[READ_ROLE_IDX],
      salts[READ_ROLE_IDX],
      proofs[READ_ROLE_IDX]
    );

    // Check if the read rule has a read action
    super._requireReadAction(
      signingRoot_,
      readRoleIndex,
      salts[READ_ROLE_ACTION_IDX],
      proofs[READ_ROLE_ACTION_IDX]
    );

    // Check if the token has the read role assigned to it
    super._requireTokenHasRole(
      signingRoot_,
      tokenId,
      properties[TOKEN_ROLE_IDX],
      values[READ_ROLE_IDX], // the value from read role proof
      salts[TOKEN_ROLE_IDX],
      proofs[TOKEN_ROLE_IDX]
    );

    //mint the token
    super._mintAnchor(
      to,
      tokenId,
      anchorId,
      signingRoot_,
      values,
      salts,
      proofs
    );

    // Store the token details
    _tokenDetails[tokenId] = TokenDetails(
      _getSender(),
      values[GROSS_AMOUNT_IDX],
      values[CURRENCY_IDX],
      values[DUE_DATE_IDX],
      anchorId,
      nextAnchorId_,
      documentRoot_
    );

    emit InvoiceUnpaidMinted(
      to,
      tokenId
    );
  }

}

