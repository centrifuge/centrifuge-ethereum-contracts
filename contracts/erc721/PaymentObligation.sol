pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "contracts/lib/MerkleProofSha256.sol";
import "contracts/erc721/UserMintableERC721.sol";
import "contracts/Identity.sol";
import "contracts/IdentityRegistry.sol";


contract PaymentObligation is UserMintableERC721 {

  event PaymentObligationMinted(
    address to,
    uint256 tokenId,
    string tokenURI
  );

  // anchor registry
  address internal identityRegistry_;
  // hardcoded supported fields for minting a PaymentObligation
  string[4] internal supportedFields_ = [
    "gross_amount",
    "currency",
    "due_date",
    "document_type"
  ];
  // Hardcoded  field labels that can mint a Payment Obligation
  // The value of the field must be a valid centrifuge id

  mapping(string => bool) internal supportedCollaborators_;
  /*string[4] internal supportedCollaborators_ = ["collaborators[1]","collaborators[2]","collaborators[3]","collaborators[0]"];
  bytes internal collaboratorPrefix = "collaborators";*/

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
    /* TODO add array of strings as a param to the constructor
     * in order to set the supported labels for collaborator
     * This is not possible right now because truffle@beta supports 1.0.0-beta.35
     * and the ABIEncoderV2 is available from 1.0.0-beta.36
     */

    supportedCollaborators_["collaborators[0]"] = true;

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
   * @param _collaboratorField string The values of the leafs that is being proved
   * Will be converted to string and concatenated for proof verification as outlined in
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
    string _collaboratorField,
    uint48 _collaboratorValue,
    string[5] _values,
    bytes32[5] _salts,
    bytes32[][5] _proofs
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

    require(
      MerkleProofSha256.verifyProof(
        _proofs[3],
        _merkleRoot,
        _hashLeafData(supportedFields_[3], "http://github.com/centrifuge/centrifuge-protobufs/invoice/#invoice.InvoiceData", _salts[3])
      ),
      "merkle tree needs to validate document_type is invoice"
    );

    // Check the label for the _collaboratorField
    require(
      supportedCollaborators_[_collaboratorField] == true,
      "Collaborator property name is not supported"
    );

    require(
      _isValidCollaborator(_collaboratorValue) == true,
      "Collaborator identity not valid"
    );

    require(
      MerkleProofSha256.verifyProof(
        _proofs[4],
        _merkleRoot,
        _hashLeafData(_collaboratorField, _values[4], _salts[4])
      ),
      "merkle tree needs to validate collaborator field"
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




  // Validate that the
  // @param _message keccak256 encoded message
  // @param _centrifugeId Centrifuge Identity identifier
  // @param _signature Signed message
  function _isValidCollaborator(
    uint48 _centrifugeId
  )
  internal
  view
  returns (bool)
  {
    // get address of the identity associated to the _centrifugeId
    IdentityRegistry registry = IdentityRegistry(identityRegistry_);
    address identityAddress = registry.getIdentityByCentrifugeId(_centrifugeId);
    if (identityAddress == 0x0)
      return false;
    return (Identity(identityAddress).owner() == msg.sender);
  }


}

