pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "contracts/erc721/UserMintableERC721.sol";


/**
 * @title MockUserMintableERC721
 * This mock is for easy testing purposes of internal methods
 */
contract MockUserMintableERC721 is UserMintableERC721 {

  constructor(
    string memory _name,
    string memory _symbol,
    address _anchorRegistry
  )
  public
  {
    UserMintableERC721.initialize(
      _name,
      _symbol,
      _anchorRegistry
    );
  }

  function hashLeafData(
    string calldata _leafName,
    string calldata _leafValue,
    bytes32 _leafSalt
  )
  external pure
  returns (bytes32)
  {
    return super._hashLeafData(_leafName, _leafValue, _leafSalt);
  }

  function isValidAnchor(
    uint256 _documentId,
    bytes32 _merkleRoot
  )
  public view
  returns (bool)
  {
    return super._isValidAnchor(
      _documentId,
      _merkleRoot
    );
  }

}
