pragma solidity ^0.4.24;

import "contracts/AnchorRepository.sol";


/**
 * @title MockAnchorRepository
 * This mock is for easy testing purposes of an anchor Repository
 * that goes hand in hand with a mintable ERC721 contract
 */
contract MockAnchorRepository {
  // A simplistic representation of a document anchor
  struct Anchor {
    bytes32 documentRoot;
  }

  mapping(uint256 => Anchor) public anchors;

  /**
   * @dev Sets the anchor details for a document.
   * @param _anchorId bytes32 The document anchor identifier
   * @param _documentRoot bytes32 The root hash of document
   */
  function setAnchorById(uint256 _anchorId, bytes32 _documentRoot)
  external payable
  {
    // not allowing empty vals
    require(_anchorId != 0x0);
    require(_documentRoot != 0x0);

    anchors[_anchorId] = Anchor(_documentRoot);
  }

  /**
   * @dev Gets the anchor details for a document.
   * @param _identifier bytes32 The document anchor identifier
   * @return identifier bytes32 The document anchor identifier as found
   * @return merkleRoot bytes32 The document's root hash value
   */
  function getAnchorById (uint256 _identifier)
  public
  view
  returns (
    uint256 identifier,
    bytes32 merkleRoot
    )
  {
    return (
      _identifier,
      anchors[_identifier].documentRoot
    );
  }
}
