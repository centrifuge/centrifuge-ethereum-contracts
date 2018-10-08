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
  // hardcoded supported fields for minting a PaymentObligation
  string[3] internal supportedFields_ = ["gross_amount", "currency", "due_date"];

  struct PODetails {
    string grossAmount;
    string currency;
    string dueDate;
  }

  mapping(uint256 => PODetails) internal poDetails_;

  /** 
   * @dev Constructor function
   * @param _name string The name of this token 
   * @param _symbol string The shorthand token identifier
   * @param _anchorRegistry address The address of the anchor registry
   * that is backing this token's mint method.
   * @param _identityRegistry address The address of the identity registry
   * that ensures that the sender is authorized to mint the token
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

  // TODO add document type and proove that the sender is a collaborator
  /**
   * @dev Mints a token after validating the given merkle proof
   * and comparing it to the anchor registry's stored hash/doc ID.
   * @param _to address The recipient of the minted token
   * @param _tokenId uint256 The ID for the minted token
   * @param _tokenURI string The metadata uri
   * @param _anchorId bytes32 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param _merkleRoot bytes32 The root hash of the merkle proof/doc
   * @param _values bytes32[3] The values of the leafs that is being proved
   * Will be converted to string and concatenated for proof verification as outlined in
   * precise-proofs library.
   * @param _salts bytes32[3] The salts for the field that is being proved
   * Will be concatenated for proof verification as outlined in
   * precise-proofs library.
   * @param _proofs bytes32[][3] Documents proofs that are needed
   * for proof verification as outlined in precise-proofs library.
   */
  function mint(
    address _to,
    uint256 _tokenId,
    string _tokenURI,
    uint256 _anchorId,
    bytes32 _merkleRoot,
    string[3] _values,
    bytes32[3] _salts,
    bytes32[][3] _proofs
  )
  public
  {

    require(
      MerkleProofSha256.verifyProof(
        _proofs[0],
        _merkleRoot,
        _hashLeafData(supportedFields_[0], _values[0], _salts[0])
      ),
      "merkle tree needs to validate gross_amount"
    );


    require(
      MerkleProofSha256.verifyProof(
        _proofs[1],
        _merkleRoot,
        _hashLeafData(supportedFields_[1], _values[1], _salts[1])
      ),
      "merkle tree needs to validate currency"
    );

    require(
      MerkleProofSha256.verifyProof(
        _proofs[2],
        _merkleRoot,
        _hashLeafData(supportedFields_[2], _values[2], _salts[2])
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

