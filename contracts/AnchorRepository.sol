pragma solidity 0.5.0;

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
  mapping(uint256 => PreAnchor) internal _preCommits;
  // store _commits
  mapping(uint256 => bytes32) internal _commits;
  // The number of blocks for which a precommit is valid
  uint256 constant internal expirationLength = 15;

  /**
   * @param anchorId Id for an Anchor.
   * @param signingRoot merkle tree for a document that does not contain the signatures
   * @param expirationBlock uint256, block number when the precommit expires.
   */
  function preCommit(
    uint256 anchorId,
    bytes32 signingRoot,
    uint256 expirationBlock
  )
  external
  {

    // Check if expirationBlock is within the allowed limit
    require(
      block.number <= expirationBlock &&
      expirationBlock <= (block.number + expirationLength),
      "Expiration Block is not within limit"
    );

    // do not allow a precommit if there is already a valid one in place
    require(hasValidPreCommit(anchorId) == false,"Precommit exists for the given anchor");

    _preCommits[anchorId] = PreAnchor(
      signingRoot,
      msg.sender,
      uint32(expirationBlock)
    );

    emit AnchorPreCommitted(
      msg.sender,
      anchorId,
      uint32(block.number)
    );
  }

  /**
   * @param anchorId Id for an Anchor.
   * @param documentRoot merkle tree for a document that will be anchored/commited. It also contains the signatures
   * @param documentProofs Array containing proofs for the document's signatures.
   * The documentRoot must be a merkle tree constructed from the signingRoot plus all signatures
   */
  function commit(
    uint256 anchorId,
    bytes32 documentRoot,
    bytes32[] calldata documentProofs
  )
  external
  {
    //not allowing to write to an existing anchor
    require(_commits[anchorId] == 0x0);

    // Check if there is a precommit and enforce it
    if (_preCommits[anchorId].expirationBlock != 0x0) {
      // check that the precommit has the same _identity
      require(_preCommits[anchorId].identity == msg.sender,"Precommit owned by someone else");
      require(hasValidPreCommit(anchorId) == true,"Precommit is expired");
      require(
        MerkleProof.verify(
          documentProofs,
          documentRoot,
          _preCommits[anchorId].signingRoot
        ),
        "Signing root validation failed"
      );

    }

    _commits[anchorId] = documentRoot;
    emit AnchorCommitted(
      msg.sender,
      anchorId,
      documentRoot,
      uint32(block.number)
    );

  }

  /**
   * @param id Id for an Anchor.
   * @return Struct with anchorId, documentRoot and the identity
   */
  function getAnchorById(uint256 id)
  public
  view
  returns (
    uint256 anchorId,
    bytes32 documentRoot
  )
  {
    return (
      id,
      _commits[id]
    );
  }

  /**
   * @dev Check if there is a valid precommit for an anchorID
   * @param anchorId Id for an Anchor.
   * @return true if there is a valid precommit for the provided anchorId
   */
  function hasValidPreCommit(uint256 anchorId)
  public
  view
  returns (bool valid)
  {
    return (
      _preCommits[anchorId].expirationBlock != 0x0 &&
      _preCommits[anchorId].expirationBlock > block.number
    );
  }
}
