pragma solidity ^0.5.3;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "contracts/erc721/UserMintableERC721.sol";
import "contracts/Identity.sol";
import "contracts/lib/Signatures.sol";


contract InvoiceUnpaidNFT is Initializable, UserMintableERC721 {

  event InvoiceUnpaidMinted(
    address to,
    uint256 tokenId,
    uint256 tokenIndex
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
  uint8 constant internal DOC_DATA_ROOT_IDX = 5;
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
      "CNT_INV_UNPD",
      tokenUriBase,
      anchorRegistry,
      identityFactory
    );
  }

  function _mint(
    address to,
    uint256 tokenId,
    uint256 anchorId,
    ProofsDetails memory pd
  )
  internal
  {
    // First check if the tokenId exists
    require(
      !_exists(tokenId),
      "Token exists"
    );

    // Get the document root from AnchorRepository
    (bytes32 documentRoot_, uint32 anchoredBlock_) = super._getDocumentRoot(anchorId);
    bytes32 docDataRoot_ = bytes32(Utilities.bytesToUint(pd.values[DOC_DATA_ROOT_IDX]));
    uint256 nextAnchorId_ = Utilities.bytesToUint(pd.values[NEXT_VERSION_IDX]);
    bytes signatureOnly = pd.values[SIGNATURE_IDX];
    delete signatureOnly[signatureOnly.length-1];
    signatureOnly.length--;

    // Check if status of invoice is unpaid
    require(
      MerkleProof.verifySha256(
        pd.proofs[STATUS_IDX],
        docDataRoot_,
        sha256(
          abi.encodePacked(
            INVOICE_STATUS, // compact property for  invoice.status, invoice = 1, status = 2
            INVOICE_STATUS_UNPAID, // bytes value for "unpaid"
            pd.salts[STATUS_IDX]
          )
        )
      ),
      "Invoice status is not unpaid"
    );

    // Check if sender is a registered identity
    super._requireValidIdentity(
      docDataRoot_,
      INVOICE_SENDER,
      _getSender(),
      pd.salts[SENDER_IDX],
      pd.proofs[SENDER_IDX]
    );

    // Extract the public key from the signature
    bytes32 pbKey_ = bytes32(
      uint256(
        docDataRoot_.toEthSignedMessageHash().recover(signatureOnly)
      )
    );

    bytes32[] memory b32Values = new bytes32[](4);
    b32Values[0] = documentRoot_;
    b32Values[1] = docDataRoot_;
    b32Values[2] = pd.salts[SIGNATURE_IDX];
    b32Values[3] = pbKey_;

    bytes[] memory btsValues = new bytes[](1);
    btsValues[0] = pd.values[SIGNATURE_IDX];

    // Make sure that the sender signed the document
    super._requireSignedByIdentity(
      b32Values,
      btsValues,
      anchoredBlock_,
      _getSender(),
      pd.proofs[SIGNATURE_IDX],
      pd.proofs[DOC_DATA_ROOT_IDX]
    );

    // Enforce that there is not a newer version of the document on chain
    super._requireIsLatestDocumentVersion(
      docDataRoot_,
      nextAnchorId_,
      pd.salts[NEXT_VERSION_IDX],
      pd.proofs[NEXT_VERSION_IDX]
    );

    // Verify that only one token per document/registry is minted
    super._requireOneTokenPerDocument(
      docDataRoot_,
      tokenId,
      pd.salts[NFT_UNIQUE_IDX],
      pd.proofs[NFT_UNIQUE_IDX]
    );

    // Check if document has a read rule defined
    bytes8 readRoleIndex = super._requireReadRole(
      docDataRoot_,
      pd.properties[READ_ROLE_IDX],
      pd.values[READ_ROLE_IDX],
      pd.salts[READ_ROLE_IDX],
      pd.proofs[READ_ROLE_IDX]
    );

    // Check if the read rule has a read action
    super._requireReadAction(
      docDataRoot_,
      readRoleIndex,
      pd.salts[READ_ROLE_ACTION_IDX],
      pd.proofs[READ_ROLE_ACTION_IDX]
    );

    // Check if the token has the read role assigned to it
    super._requireTokenHasRole(
      docDataRoot_,
      tokenId,
      pd.properties[TOKEN_ROLE_IDX],
      pd.values[READ_ROLE_IDX], // the value from read role proof
      pd.salts[TOKEN_ROLE_IDX],
      pd.proofs[TOKEN_ROLE_IDX]
    );

    //mint the token
    super._mintAnchor(
      to,
      tokenId,
      anchorId,
      docDataRoot_,
      pd.values,
      pd.salts,
      pd.proofs
    );

    // Store the token details
    _tokenDetails[tokenId] = TokenDetails(
      _getSender(),
      pd.values[GROSS_AMOUNT_IDX],
      pd.values[CURRENCY_IDX],
      pd.values[DUE_DATE_IDX],
      anchorId,
      nextAnchorId_,
      documentRoot_
    );

    emit InvoiceUnpaidMinted(
      to,
      tokenId,
      currentIndexOfToken(tokenId)
    );
  }

  /**
   * @dev Mints a token after validating the given merkle proofs
   * and comparing it to the anchor registry's stored hash/doc ID.
   * Only one more variable allowed
   * @param to address The recipient of the minted token
   * @param tokenId uint256 The ID for the minted token
   * @param anchorId uint256 The ID of the document as identified
   * by the set up anchorRegistry.
   * using precise-proofs
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
    ProofsDetails memory pd_ = ProofsDetails(properties, values, salts, proofs);
    _mint(to, tokenId, anchorId, pd_);
  }


}

