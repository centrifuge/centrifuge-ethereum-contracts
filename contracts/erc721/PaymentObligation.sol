pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/MerkleProof.sol";
import "contracts/erc721/UserMintableERC721.sol";


contract PaymentObligation is UserMintableERC721 {
  // anchor registry
  address internal identityRegistry_;

  string[2] internal supportedFields = ["valueA", "valueA"];

  /** 
   * @dev Constructor function
   * @param _name string The name of this token 
   * @param _symbol string The shorthand token identifier
   * @param _anchorRegistry address The address of the anchor registry
   * that is backing this token's mint method.
   */
  constructor(string _name, string _symbol, address _anchorRegistry, address _identityRegistry)
  UserMintableERC721(_name, _symbol, _anchorRegistry)
  public
  {
    identityRegistry_ = _identityRegistry;
  }



  function mint(
    address _to,
    uint256 _tokenId,
    uint256 _anchorId,
    bytes32 _merkleRoot,
    string[2] _leafValues,
    bytes32[2] _leafSalts,
    bytes32[][2] _proofs
  )
  external
  {
    // explicitly not checking on plain text values being empty
    // as it might actually be a use-case to have empty values being provided

    // Add business-logic-specific validations based on the clear-text values here
    for (uint256 i = 0; i < supportedFields.length; i++) {


      bytes32 leaf = _hashLeafData(supportedFields[i], _leafValues[i], _leafSalts[i]);
      require(
        MerkleProof.verifyProof(_proofs[i], _merkleRoot, leaf),
        "merkle tree needs to validate"
      );
    }

    //Add business-logic-specific validations here

    super._mintMerkle(
      _to,
      _tokenId,
      _anchorId,
      _merkleRoot
    );
  }

}