pragma solidity 0.5.0;
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
  bytes[] public _mandatoryFields;

  struct PODetails {
    bytes grossAmount;
    bytes currency;
    bytes dueDate;
  }

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
   * @param registry address The address of the anchor registry
   * that is backing this token's mint method.
   * that ensures that the sender is authorized to mint the token
   */
  function initialize(
    address registry
  )
  external
  initializer
  {
    // compact property for "invoice.gross_amount",invoice = 1, gross_amount = 14
    _mandatoryFields.push(hex"010000000000000e");
    // compact property for invoice.currency, invoice = 1, currency = 13
    _mandatoryFields.push(hex"010000000000000d");
    // compact property for  invoice.due_date, invoice = 1, due_date = 22
    _mandatoryFields.push(hex"0100000000000016");

    UserMintableERC721.initialize(
      "Centrifuge Payment Obligations",
      "CENT_PAY_OB",
      registry,
      _mandatoryFields
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
  external
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

    // Enforce that there is not a newer version of the document on chain
    super._requireIsLatestDocumentVersion(
      merkleRoot_,
      nextAnchorId,
      salts[3],
      proofs[3]
    );

    // Verify that only one token per document/registry is minted
    super._requireOneTokenPerDocument(
      merkleRoot_,
      tokenId,
      salts[4],
      proofs[4]
    );

    // Check if document has a read rule defined
    bytes8 readRoleIndex = super._requireReadRole(
      merkleRoot_,
      properties[0],
      values[3],
      salts[5],
      proofs[5]
    );

    // Check if the read rule has a read action
    super._requireReadAction(
      merkleRoot_,
      readRoleIndex,
      salts[6],
      proofs[6]
    );

    // Check if the token has the read role assigned to it
    super._requireTokenHasRole(
      merkleRoot_,
      tokenId,
      properties[1],
      values[3], // the value from read role proof
      salts[7],
      proofs[7]
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
      values[0],
      values[1],
      values[2]
    );

    emit PaymentObligationMinted(
      to,
      tokenId,
      tokenURI
    );
  }

}

