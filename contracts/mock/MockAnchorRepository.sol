pragma solidity 0.5.3;

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

  mapping(uint256 => Anchor) private _anchors;

  /**
   * @dev Sets the anchor details for a document.
   * @param anchorId bytes32 The document anchor identifier
   * @param documentRoot bytes32 The root hash of document
   */
  function setAnchorById(uint256 anchorId, bytes32 documentRoot)
  external
  {
    // not allowing empty vals
    require(anchorId != 0x0);
    require(documentRoot != 0x0);

    _anchors[anchorId] = Anchor(documentRoot);
  }

  /**
   * @dev Gets the anchor details for a document.
   * @param id bytes32 The document anchor identifier
   * @return identifier bytes32 The document anchor identifier as found
   * @return merkleRoot bytes32 The document's root hash value
   */
  function getAnchorById (uint256 id)
  public
  view
  returns (
    uint256 identifier,
    bytes32 merkleRoot,
    uint32 blockNumber
    )
  {
    return (
      id,
      _anchors[id].documentRoot,
      0x0
    );
  }
}
