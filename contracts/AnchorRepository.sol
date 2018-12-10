pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/cryptography/MerkleProof.sol";
import "contracts/Identity.sol";


contract AnchorRepository is Initializable {

  event AnchorCommitted(
    address indexed from,
    uint256 indexed anchorId,
    bytes32 documentRoot,
    uint32 blockHeight
  );

  event AnchorPreCommitted(
    address indexed from,
    uint256 indexed anchorId,
    uint32 blockHeight
  );

  struct PreAnchor {
    bytes32 signingRoot;
    address identity;
    uint32 expirationBlock;
  }

  // store precommits
  mapping(uint256 => PreAnchor) public preCommits;
  // store commits
  mapping(uint256 => bytes32) public commits;
  // The number of blocks for which a precommit is valid
  uint256 constant internal expirationLength = 15;

  /**
   * @param _anchorId Id for an Anchor.
   * @param _signingRoot merkle tree for a document that does not contain the signatures
   * @param _expirationBlock uint256, block number when the precommit expires.
   */
  function preCommit(
    uint256 _anchorId,
    bytes32 _signingRoot,
    uint256 _expirationBlock
  )
  external
  payable
  {

    // Check if _expirationBlock is within the allowed limit
    require(
      block.number <= _expirationBlock &&
      _expirationBlock <= (block.number + expirationLength)
    );

    // do not allow a precommit if there is already a valid one in place
    require(hasValidPreCommit(_anchorId) == false);

    preCommits[_anchorId] = PreAnchor(
      _signingRoot,
      msg.sender,
      uint32(_expirationBlock)
    );

    emit AnchorPreCommitted(
      msg.sender,
      _anchorId,
      uint32(block.number)
    );
  }

  /**
   * @param _anchorId Id for an Anchor.
   * @param _documentRoot merkle tree for a document that will be anchored/commited. It also contains the signatures
   * @param _documentProofs Array containing proofs for the document's signatures.
   * The documentRoot must be a merkle tree constructed from the signingRoot plus all signatures
   */
  function commit(
    uint256 _anchorId,
    bytes32 _documentRoot,
    bytes32[] _documentProofs
  )
  external
  payable
  {
    //not allowing to write to an existing anchor
    require(commits[_anchorId] == 0x0);

    // Check if there is a precommit and enforce it
    if (preCommits[_anchorId].expirationBlock != 0x0) {
      require(hasValidPreCommit(_anchorId) == true);
      require(
        MerkleProof.verify(
          _documentProofs,
          _documentRoot,
          preCommits[_anchorId].signingRoot
        )
      );
      // check that the precommit has the same _identity
      require(preCommits[_anchorId].identity == msg.sender);
    }

    commits[_anchorId] = _documentRoot;
    emit AnchorCommitted(
      msg.sender,
      _anchorId,
      _documentRoot,
      uint32(block.number)
    );

  }

  /**
   * @param _anchorId Id for an Anchor.
   * @return Struct with anchorId, documentRoot and the identity
   */
  function getAnchorById(uint256 _anchorId)
  public
  view
  returns (
    uint256 anchorId,
    bytes32 documentRoot
  )
  {
    return (
    _anchorId,
    commits[_anchorId]
    );
  }

  /**
   * @dev Check if there is a valid precommit for an anchorID
   * @param _anchorId Id for an Anchor.
   * @return true if there is a valid precommit for the provided anchorId
   */
  function hasValidPreCommit(uint256 _anchorId)
  public
  view
  returns (bool)
  {
    return (
    preCommits[_anchorId].expirationBlock != 0x0 &&
    preCommits[_anchorId].expirationBlock > block.number
    );
  }
}
