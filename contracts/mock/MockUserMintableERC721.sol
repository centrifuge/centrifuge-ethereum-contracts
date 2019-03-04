pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;

import "contracts/erc721/UserMintableERC721.sol";


/**
 * @title MockUserMintableERC721
 * This mock is for easy testing purposes of internal methods
 */
contract MockUserMintableERC721 is UserMintableERC721 {

  address private _ownAddress = address(this);

  constructor(
    string memory name,
    string memory symbol,
    address anchorRegistry,
    address identityFactory,
    bytes[] memory mandatoryFields
  )
  public
  {
    UserMintableERC721.initialize(
      name,
      symbol,
      anchorRegistry,
      identityFactory,
      mandatoryFields
    );
  }

  function getDocumentRoot(
    uint256 anchorId
  )
  external
  view
  returns (bytes32 documentRoot)
  {
    return super._getDocumentRoot(anchorId);
  }

  function requireValidIdentity(
    bytes32 documentRoot,
    bytes calldata property,
    bytes calldata value,
    bytes32 salt,
    bytes32[] calldata proof
  )
  external
  view
  {
    super._requireValidIdentity(
       documentRoot,
      property,
      value,
      salt,
      proof
    );
  }

  function requireIsLatestDocumentVersion(
    bytes32 documentRoot,
    uint256 nextAnchorId,
    bytes32 salt,
    bytes32[] calldata proof
  )
  external
  view
  {
    super._requireIsLatestDocumentVersion(
      documentRoot,
      nextAnchorId,
      salt,
      proof
    );
  }

  function requireReadRole(
    bytes32 documentRoot,
    bytes calldata property,
    bytes calldata value,
    bytes32 salt,
    bytes32[] calldata proof
  )
  external
  pure
  returns (bytes8 readRuleIndex)
  {

    return super._requireReadRole(
      documentRoot,
      property,
      value,
      salt,
      proof
    );
  }

  function requireReadAction(
    bytes32 documentRoot,
    bytes8 _readRuleIndex,
    bytes32 salt,
    bytes32[] calldata proof
  )
  external
  pure
  {
    super._requireReadAction(
      documentRoot,
      _readRuleIndex,
      salt,
      proof
    );
  }

  function requireTokenHasRole(
    bytes32 documentRoot,
    uint256 tokenId,
    bytes calldata property,
    bytes calldata roleIndex,
    bytes32 salt,
    bytes32[] calldata proof
  )
  external
  view
  {
    super._requireTokenHasRole(
      documentRoot,
      tokenId,
      property,
      roleIndex,
      salt,
      proof
    );
  }

  function requireOneTokenPerDocument(
    bytes32 documentRoot,
    uint256 tokenId,
    bytes32 salt,
    bytes32[] calldata proof
  )
  external
  view
  {
    super._requireOneTokenPerDocument(
      documentRoot,
      tokenId,
      salt,
      proof
    );
  }


  function mintAnchor(
    address to,
    uint256 tokenId,
    uint256 anchorId,
    bytes32 merkleRoot,
    string memory tokenURI,
    bytes[] memory values,
    bytes32[] memory salts,
    bytes32[][] memory proofs
  )
  public
  {
    super._mintAnchor(
      to,
      tokenId,
      anchorId,
      merkleRoot,
      tokenURI,
      values,
      salts,
      proofs
    );
  }

  function setOwnAddress(address ownAddress)
  public
  {
    _ownAddress = ownAddress;
  }

  function _getOwnAddress()
  internal
  view
  returns (address)
  {
    return _ownAddress;
  }

}
