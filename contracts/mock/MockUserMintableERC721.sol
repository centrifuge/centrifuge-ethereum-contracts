pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "contracts/erc721/UserMintableERC721.sol";


/**
 * @title MockUserMintableERC721
 * This mock is for easy testing purposes of internal methods
 */
contract MockUserMintableERC721 is UserMintableERC721 {

  address ownAddress_ = address(this);

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

  function getDocumentRoot(
    uint256 _anchorId
  )
  external
  view
  returns (bytes32 documentRoot)
  {
    return super._getDocumentRoot(_anchorId);
  }



  function requireIsLatestDocumentVersion(
    bytes32 _documentRoot,
    uint256 _nextAnchorId,
    bytes32 _salt,
    bytes32[] calldata _proof
  )
  external
  view
  {
    super._requireIsLatestDocumentVersion(
      _documentRoot,
      _nextAnchorId,
      _salt,
      _proof
    );
  }

  function requireReadRole(
    bytes32 _documentRoot,
    bytes calldata _property,
    bytes calldata _value,
    bytes32 _salt,
    bytes32[] calldata _proof
  )
  external
  pure
  returns (bytes8 readRuleIndex)
  {

    return super._requireReadRole(
      _documentRoot,
      _property,
      _value,
      _salt,
      _proof
    );
  }

  function requireReadAction(
    bytes32 _documentRoot,
    bytes8 _readRuleIndex,
    bytes32 _salt,
    bytes32[] calldata _proof
  )
  external
  pure
  {
    super._requireReadAction(
      _documentRoot,
      _readRuleIndex,
      _salt,
      _proof
    );
  }

  function requireTokenHasRole(
    bytes32 _documentRoot,
    uint256 _tokenId,
    bytes calldata _property,
    bytes calldata _roleIndex,
    bytes32 _salt,
    bytes32[] calldata _proof
  )
  external
  view
  {
    super._requireTokenHasRole(
      _documentRoot,
      _tokenId,
      _property,
      _roleIndex,
      _salt,
      _proof
    );
  }

  function requireOneTokenPerDocument(
    bytes32 _documentRoot,
    uint256 _tokenId,
    bytes32 _salt,
    bytes32[] calldata _proof
  )
  external
  view
  {
    super._requireOneTokenPerDocument(
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

  function setOwnAddress(address _ownAddress)
  public
  {
    ownAddress_ = _ownAddress;
  }

  function _getOwnAddress()
  internal
  view
  returns (address)
  {
    return ownAddress_;
  }

}
