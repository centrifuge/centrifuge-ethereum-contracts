pragma solidity ^0.4.24;

import "contracts/erc721/UserMintableERC721.sol";


/**
 * @title MockUserMintableERC721
 * This mock is for easy testing purposes of internal methods
 */
contract MockUserMintableERC721 is UserMintableERC721 {

  constructor(string _name, string _symbol, address _anchorRegistry)
  UserMintableERC721(_name, _symbol, _anchorRegistry)
  public
  {
  }

  function hashLeafData(
    string _leafName,
    string _leafValue,
    bytes32 _leafSalt
  )
  external pure
  returns (bytes32)
  {
    return super._hashLeafData(_leafName, _leafValue, _leafSalt);
  }

  function isRegisteredInRegistryWithRoot(
    uint256 _documentId,
    bytes32 _merkleRoot
  )
  public view
  returns (bool)
  {
    return super._isRegisteredInRegistryWithRoot(
      _documentId,
      _merkleRoot
    );
  }

  function mintWithAnchor(
    address _to,
    uint256 _tokenId,
    uint256 _anchorId,
    bytes32 _merkleRoot
  )
  public
  {
    super._mintWithAnchor(
      _to,
      _tokenId,
      _anchorId,
      _merkleRoot
    );
  }
}
