pragma solidity 0.5.3;
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

  struct PODetails {
    bytes grossAmount;
    bytes currency;
    bytes dueDate;
  }

  /** @dev indexes used for the mint method arrays
  * Properties, values, salts and proofs have variant lengths and
  * not all arrays contain values for all the fields
  * The properties array contains READ_ROLE, TOKEN_ROLE
  * The values array contains only GROSS_AMOUNT, CURRENCY, DUE_DATE, SENDER, READ_ROLE
  * salts and proofs contains values for all fields
  */
  uint8 constant internal GROSS_AMOUNT_IDX = 0;
  uint8 constant internal CURRENCY_IDX = 1;
  uint8 constant internal DUE_DATE_IDX = 2;
  uint8 constant internal SENDER_IDX = 3;
  uint8 constant internal READ_ROLE_IDX = 4;
  uint8 constant internal READ_ROLE_ACTION_IDX = 5;
  uint8 constant internal TOKEN_ROLE_IDX = 6;
  uint8 constant internal STATUS_IDX = 7;
  uint8 constant internal NEXT_VERSION_IDX = 8;
  uint8 constant internal NFT_UNIQUE_IDX = 9;

  // Indexes for the properties array
  uint8 constant internal READ_ROLE_PROP_IDX = 0;
  uint8 constant internal TOKEN_ROLE_PROP_IDX = 1;

  // Protobuf  Property and required values for specific invoice fields
  // The name of a field is the Protobuf indexes
  // https://github.com/centrifuge/centrifuge-protobufs/blob/master/invoice/invoice.proto
  bytes constant internal INVOICE_STATUS_PROPERTY = hex"0001000000000002"; // dec: 2
  bytes constant internal INVOICE_STATUS_VALUE = hex"756e70616964";    // value:"unpaid"

  bytes constant internal INVOICE_GROSS_AMOUNT_PROPERTY = hex"000100000000000e"; // dec: 14
  bytes constant internal INVOICE_CURRENCY_PROPERTY = hex"000100000000000d"; // dec: 13
  bytes constant internal INVOICE_DUE_DATE_PROPERTY = hex"0001000000000016"; // dec: 22
  bytes constant internal INVOICE_SENDER_PROPERTY = hex"0001000000000013"; // dec: 19



  // Token details, specific field values
  mapping(uint256 => PODetails) internal _poDetails;

  /**
  * @dev Returns the values associated with a token
  * @param grossAmount bytes The gross amount of the invoice
  * @param currency bytes The currency used in the invoice
  * @param dueDate bytes The Due data of the invoice
  * @param anchorId uint256 The ID of the document as identified
  * by the set up anchorRegistry
  * @param documentRoot bytes32 The root hash of the merkle proof/doc
  */
  function getTokenDetails(uint256 tokenId)
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
    return (
      _poDetails[tokenId].grossAmount,
      _poDetails[tokenId].currency,
      _poDetails[tokenId].dueDate,
      _tokenDetails[tokenId].anchorId,
      _tokenDetails[tokenId].rootHash
    );
  }


  /**
   * @param anchorRegistry address The address of the anchor registry
   * @param identityFactory address The address of the identity factory
   * that is backing this token's mint method.
   * that ensures that the sender is authorized to mint the token
   */
  function initialize(
    address anchorRegistry,
    address identityFactory
  )
  public
  initializer
  {
    //@dev Order is important. Any change will impact the mint method
    // compact property for "invoice.gross_amount",invoice = 1, gross_amount = 14
    _mandatoryFields.push(INVOICE_GROSS_AMOUNT_PROPERTY);
    // compact property for invoice.currency, invoice = 1, currency = 13
    _mandatoryFields.push(INVOICE_CURRENCY_PROPERTY);
    // compact property for  invoice.due_date, invoice = 1, due_date = 22
    _mandatoryFields.push(INVOICE_DUE_DATE_PROPERTY);

    UserMintableERC721.initialize(
      "Centrifuge Payment Obligations",
      "CENT_PAY_OB",
      anchorRegistry,
      identityFactory
    );
  }

  /**
   * @dev Mints a token after validating the given merkle proofs
   * and comparing it to the anchor registry's stored hash/doc ID.
   * @param to address The recipient of the minted token
   * @param tokenId uint256 The ID for the minted token
   * @param tokenURI string The metadata uri
   * @param anchorId uint256 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param nextAnchorId uint256 The id that will be anchored when a change
   * is made to the document. It is not part of the values array in order
   * to avoid a bytes to uint conversion in the contract
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
    string memory tokenURI,
    uint256 anchorId,
    uint256 nextAnchorId,
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
    bytes32 merkleRoot_ = super._getDocumentRoot(
      anchorId
    );


    // Check if status of invoice is unpaid
    require(
      MerkleProof.verifySha256(
        proofs[STATUS_IDX],
        merkleRoot_,
        sha256(
          abi.encodePacked(
              INVOICE_STATUS_PROPERTY, // compact property for  invoice.status, invoice = 1, status = 2
                INVOICE_STATUS_VALUE, // bytes value for "unpaid"
            salts[STATUS_IDX]
          )
        )
      ),
      "Invoice status is not unpaid"
    );

    // Check if sender is a registered identity
    super._requireValidIdentity(
      merkleRoot_,
        INVOICE_SENDER_PROPERTY, // compact property for  invoice.sender, invoice = 1, sender = 19
      values[SENDER_IDX],
      salts[SENDER_IDX],
      proofs[SENDER_IDX]
    );

    // Enforce that there is not a newer version of the document on chain
    super._requireIsLatestDocumentVersion(
      merkleRoot_,
      nextAnchorId,
      salts[NEXT_VERSION_IDX],
      proofs[NEXT_VERSION_IDX]
    );

    // Verify that only one token per document/registry is minted
    super._requireOneTokenPerDocument(
      merkleRoot_,
      tokenId,
      salts[NFT_UNIQUE_IDX],
      proofs[NFT_UNIQUE_IDX]
    );

    // Check if document has a read rule defined
    bytes8 readRoleIndex = super._requireReadRole(
      merkleRoot_,
      properties[READ_ROLE_PROP_IDX],
      values[READ_ROLE_IDX],
      salts[READ_ROLE_IDX],
      proofs[READ_ROLE_IDX]
    );

    // Check if the read rule has a read action
    super._requireReadAction(
      merkleRoot_,
      readRoleIndex,
      salts[READ_ROLE_ACTION_IDX],
      proofs[READ_ROLE_ACTION_IDX]
    );

    // Check if the token has the read role assigned to it
    super._requireTokenHasRole(
      merkleRoot_,
      tokenId,
      properties[TOKEN_ROLE_PROP_IDX],
      values[READ_ROLE_IDX], // the value from read role proof
      salts[TOKEN_ROLE_IDX],
      proofs[TOKEN_ROLE_IDX]
    );

    super._mintAnchor(
      to,
      tokenId,
      anchorId,
      merkleRoot_,
      tokenURI,
      values,
      salts,
      proofs
    );

    _poDetails[tokenId] = PODetails(
      values[GROSS_AMOUNT_IDX],
      values[CURRENCY_IDX],
      values[DUE_DATE_IDX]
    );

    emit PaymentObligationMinted(
      to,
      tokenId,
      tokenURI
    );
  }

}

