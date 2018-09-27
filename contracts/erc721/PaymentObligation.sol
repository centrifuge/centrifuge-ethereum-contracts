pragma solidity ^0.4.24;

import "contracts/lib/MerkleProofSha256.sol";
import "contracts/erc721/UserMintableERC721.sol";


contract PaymentObligation is UserMintableERC721 {
  // anchor registry
  address internal identityRegistry_;

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
   * @param _anchorId bytes32 The ID of the document as identified
   * by the set up anchorRegistry.
   * @param _merkleRoot bytes32 The root hash of the merkle proof/doc
   * @param _values bytes32[3] The values of the leafs that is being proved
   * Will be converted to string and concatenated for proof verification as outlined in
   * precise-proofs library.
   * @param _salts bytes32[3] The salts for the field that is being proved
   * Will be concatenated for proof verification as outlined in
   * precise-proofs library.
   * @param _amountProof bytes32[] The proof to prove the gross_amount authenticity
   * @param _amountProof bytes32[] The proof to prove the currency authenticity
   * @param _dueDateProof bytes32[] The proof to prove the due_date authenticity
   */
  function mint(
    address _to,
    uint256 _tokenId,
    uint256 _anchorId,
    bytes32 _merkleRoot,
    bytes32[3] _values,
    bytes32[3] _salts,
    bytes32[] _amountProof,
    bytes32[] _currencyProof,
    bytes32[] _dueDateProof
  )
  public
  {
    string memory grossAmount = bytes32ToStr(_values[0]);
    require(
      MerkleProofSha256.verifyProof(
        _amountProof,
        _merkleRoot,
        _hashLeafData(supportedFields_[0], grossAmount, _salts[0])
      ),
      "merkle tree needs to validate gross_amount"
    );

    string memory currency = bytes32ToStr(_values[1]);
    require(
      MerkleProofSha256.verifyProof(
        _currencyProof,
        _merkleRoot,
        _hashLeafData(supportedFields_[1], currency, _salts[1])
      ),
      "merkle tree needs to validate currency"
    );
    string memory dueDate = bytes32ToStr(_values[2]);
    require(
      MerkleProofSha256.verifyProof(
        _dueDateProof,
        _merkleRoot,
        _hashLeafData(supportedFields_[2], dueDate, _salts[2])
      ),
      "merkle tree needs to validate due_date"
    );

    super._mintWithAnchor(
      _to,
      _tokenId,
      _anchorId,
      _merkleRoot
    );
    // Store fields values
    poDetails_[_tokenId] = PODetails(grossAmount, currency, dueDate);
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
    return (
    poDetails_[_tokenId].grossAmount,
    poDetails_[_tokenId].currency,
    poDetails_[_tokenId].dueDate,
    tokenDetails_[_tokenId].anchorId,
    tokenDetails_[_tokenId].rootHash
    );
  }

  function bytes32ToStr(bytes32 x)
  private
  pure
  returns (string)
  {
    bytes memory bytesString = new bytes(32);
    uint charCount = 0;
    for (uint j = 0; j < 32; j++) {
      byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
      if (char != 0) {
        bytesString[charCount] = char;
        charCount++;
      }
    }
    bytes memory bytesStringTrimmed = new bytes(charCount);
    for (j = 0; j < charCount; j++) {
      bytesStringTrimmed[j] = bytesString[j];
    }
    return string(bytesStringTrimmed);
  }


}

