pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "contracts/lib/MerkleProof.sol";
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
   * A preCommit for an anchor expires after (current block no + expirationLength) blocks.
   * @param _anchorId Id for an Anchor.
   * @param _signingRoot merkle tree for a document that does not contain the signatures
   */
  function preCommit(
    uint256 _anchorId,
    bytes32 _signingRoot
  )
  external
  payable
  {

    // not allowing to pre-commit for an existing anchor
    require(commits[_anchorId] == 0x0,"commit exists for the given anchor");

    // do not allow a precommit if there is already a valid one in place
    require(hasValidPreCommit(_anchorId) == false,"Precommit exists for the given anchor");

    preCommits[_anchorId] = PreAnchor(
      _signingRoot,
      msg.sender,
      uint32(block.number + expirationLength)
    );

    emit AnchorPreCommitted(
      msg.sender,
      _anchorId,
      uint32(block.number)
    );
  }

  /**
   * @param _unHashedAnchorId secret anchorID for an Anchor.
   * @param _documentRoot merkle tree for a document that will be anchored/commited. It also contains the signatures
   * @param _documentProofs Array containing proofs for the document's signatures.
   * The documentRoot must be a merkle tree constructed from the signingRoot plus all signatures
   */
  function commit(
    uint256 _unHashedAnchorId,
    bytes32 _documentRoot,
    bytes32[] calldata _documentProofs
  )
  external
  payable
  {

    uint256 hashedAnchor = uint256(sha256(abi.encodePacked(_unHashedAnchorId)));

    //not allowing to write to an existing anchor
    require(commits[hashedAnchor] == 0x0);

    // Check if there is a precommit and enforce it
    if (hasValidPreCommit(hashedAnchor)) {
      // check that the precommit has the same _identity
      require(preCommits[hashedAnchor].identity == msg.sender,"Precommit owned by someone else");
      require(
        MerkleProof.verify(
          _documentProofs,
          _documentRoot,
          preCommits[hashedAnchor].signingRoot
        ),
        "Signing root validation failed"
      );

    }

    commits[hashedAnchor] = _documentRoot;
    emit AnchorCommitted(
      msg.sender,
      hashedAnchor,
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
