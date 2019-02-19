pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "contracts/erc721/UserMintableERC721.sol";


/**
 * @title MockUserMintableERC721
 * This mock is for easy testing purposes of internal methods
 */
contract MockUserMintableERC721 is UserMintableERC721 {

  address onwAddress_ = address(this);

  constructor(
    string memory _name,
    string memory _symbol,
    address _anchorRegistry,
    bytes[] memory _mandatoryFields
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



  function _getOwnAddress()
  internal
  view
  returns (address) {
    return onwAddress_;
  }

  function setOwnAddress(address _ownAddress)
  public
  {
    onwAddress_ = _ownAddress;
  }


  function hashLeafData(
    bytes calldata _leafName,
    bytes calldata _leafValue,
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
    uint256 _nextAnchorId,
    bytes32 _salt,
    bytes32[] calldata _proof
  )
  external
  view
  {
     super._isLatestDocumentVersion(
      _documentRoot,
      _nextAnchorId,
      _salt,
      _proof
    );
  }

  function hasReadRole(
    bytes32 _documentRoot,
    bytes calldata _property,
    bytes calldata _value,
    bytes32 _salt,
    bytes32[] calldata _proof
  )
  external
  view
  returns (bytes8 readRuleIndex){

    return super._hasReadRole(
      _documentRoot,
      _property,
      _value,
      _salt,
      _proof
    );
  }

  function isNftUnique(
    bytes32 _documentRoot,
    uint256 _tokenId,
    bytes32 _salt,
    bytes32[] calldata _proof
  )
  external
  view {
    super._isNftUnique(
      _documentRoot,
      _tokenId,
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
    bytes[] memory _values,
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
