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
    address _anchorRegistry,
    string[] memory _mandatoryFields
  )
  public
  {
    UserMintableERC721.initialize(
      _name,
      _symbol,
      _anchorRegistry,
      _mandatoryFields
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

  function getDocumentRoot(
    uint256 _anchorId
  )
  external
  view
  returns (bytes32 documentRoot)
  {
    return super._getDocumentRoot(_anchorId);
  }


  function isLatestDocumentVersion(
    bytes32 _documentRoot,
    string calldata _nextAnchorId,
    bytes32 _salt,
    bytes32[] calldata _proof
  )
  external
  view
  returns (uint nextAnchorId)
  {
    return super._isLatestDocumentVersion(
      _documentRoot,
      _nextAnchorId,
      _salt,
      _proof
    );
  }


  function mintAnchor(
    address _to,
    uint256 _tokenId,
    uint256 _anchorId,
    bytes32 _merkleRoot,
    string memory _tokenURI,
    string[] memory _values,
    bytes32[] memory _salts,
    bytes32[][] memory _proofs
  )
  public
  {
    super._mintAnchor(
      _to,
      _tokenId,
      _anchorId,
      _merkleRoot,
      _tokenURI,
      _values,
      _salts,
      _proofs
    );
  }
}
