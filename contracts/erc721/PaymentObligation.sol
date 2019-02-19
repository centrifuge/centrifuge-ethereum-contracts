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
  * @param grossAmount string The gross amount of the invoice
  * @param currency string The currency used in the invoice
  * @param dueDate string The Due data of the invoice
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


  function testBytes()
  external
  view
  returns (
    bytes memory result
  )
  {

    bytes memory readRoles = hex"000000130000000000000001000000020000000000000000";
    bytes memory reactAction = hex"00000013000000000000000100000004";
    bytes memory nftRole = hex"000000010000000000000001000000000000000000000000000000000000000000000000000000040000000000000000";


    bytes8 readRuleIndex = extractIndex(readRoles,4);
    bytes8 readRuleRoleIndex = extractIndex(readRoles,16);
    bytes memory readRolesProp = abi.encodePacked(hex"00000013",readRuleIndex,hex"00000002",readRuleRoleIndex);
    bytes memory readActionProp = abi.encodePacked(hex"00000013",readRuleRoleIndex,hex"00000004");

    bytes8 nftIndex = extractIndex(nftRole,40);
    bytes memory nftRoleProp = abi.encodePacked(hex"00000001",hex"0000000000000001000000000000000000000000000000000000000000000000",hex"00000004",nftIndex);

    return readRolesProp;
    // 0x00000014ec644d919d64ba6aebd8e4c094d6cea27051b857000000000000000000000000
    // 0x00000014ec644d919d64ba6aebd8e4c094d6cea27051b857000000000000000000000000
    // 0x14644d919d64ba6aebd8e4c094d6cea27051b857000000000000000000000000
    //0x000000130000000000000001000000020000000000000000
   /* bytes memory tokenBytes = hex"53cfb4da00b5752be86e31cbb93eee439f96b4758c144221e8ec28cb54f0cd62";
    uint256 token = 0x53cfb4da00b5752be86e31cbb93eee439f96b4758c144221e8ec28cb54f0cd62;

    if(abi.encode(token) == tokenBytes) {
      return hex"0000";
    }

    return abi.encode(token);*/
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
    mandatoryFields_.push(hex"000000110000000000000000"); //collaborators[0]

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
   * @param _anchorId bytes32 The ID of the document as identified
   * by the set up anchorRegistry.
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
    string memory _tokenURI,
    uint256 _anchorId,
    uint256 _nextAnchorId,
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
    uint nextVersionIndex = 5;
    super._isLatestDocumentVersion(
      merkleRoot,
      _nextAnchorId,
      _salts[nextVersionIndex],
      _proofs[nextVersionIndex]
    );

    // Enforce that only one token per document/registry is minted
    uint nftUniqueIndex = 4;
    super._isNftUnique(
      merkleRoot,
      _tokenId,
      _salts[nftUniqueIndex],
      _proofs[nftUniqueIndex]
    );

    // TODO handle colaborator validation against centrifuge identity
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

