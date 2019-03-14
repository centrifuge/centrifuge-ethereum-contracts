pragma solidity 0.5.3;

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

  struct Anchor {
    bytes32 docRoot;
    uint32 anchoredBlock;
  }

  // store precommits
  mapping(uint256 => PreAnchor) internal _preCommits;
  // store _commits
  mapping(uint256 => Anchor) internal _commits;
  // The number of blocks for which a precommit is valid
  uint256 constant internal EXPIRATION_LENGTH = 15;

  /**
   * @param anchorId Id for an Anchor.
   * @param signingRoot merkle tree for a document that does not contain the signatures
   */
  function preCommit(
    uint256 anchorId,
    bytes32 signingRoot
  )
  external
  {

    // not allowing to pre-commit for an existing anchor
    require(_commits[anchorId].docRoot == 0x0,"Commit exists for the given anchor");

    // do not allow a precommit if there is already a valid one in place
    require(hasValidPreCommit(anchorId) == false,"Precommit exists for the given anchor");

    _preCommits[anchorId] = PreAnchor(
      signingRoot,
      msg.sender,
      uint32(block.number + EXPIRATION_LENGTH)
    );

    emit AnchorPreCommitted(
      msg.sender,
      anchorId,
      uint32(block.number)
    );
  }

  /**
   * @param anchorIdPreImage pre-image for an AnchorID.
   * @param documentRoot merkle tree for a document that will be anchored/commited. It also contains the signatures
   * @param documentProofs Array containing proofs for the document's signatures.
   * The documentRoot must be a merkle tree constructed from the signingRoot plus all signatures
   */
  function commit(
    uint256 anchorIdPreImage,
    bytes32 documentRoot,
    bytes32[] calldata documentProofs
  )
  external
  {

    uint256 anchorId = uint256(sha256(abi.encodePacked(anchorIdPreImage)));

    //not allowing to write to an existing anchor
    require(_commits[anchorId].docRoot == 0x0);

    // Check if there is a precommit and enforce it
    if (hasValidPreCommit(anchorId)) {
      // check that the precommit has the same _identity
      require(_preCommits[anchorId].identity == msg.sender,"Precommit owned by someone else");
      require(
        MerkleProof.verifySha256(
          documentProofs,
          documentRoot,
          _preCommits[anchorId].signingRoot
        ),
        "Signing root validation failed"
      );

    }

    _commits[anchorId] = Anchor(
      documentRoot,
      uint32(block.number)
    );
    emit AnchorCommitted(
      msg.sender,
      anchorId,
      documentRoot,
      uint32(block.number)
    );

  }

  /**
   * @param id Id for an Anchor.
   * @return Struct with anchorId, documentRoot, anchoredBlock
   */
  function getAnchorById(uint256 id)
  external
  view
  returns (
    uint256 anchorId,
    bytes32 documentRoot,
    uint32 blockNumber
  )
  {
    return (
    id,
    _commits[id].docRoot,
    _commits[id].anchoredBlock
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
      _preCommits[anchorId].expirationBlock > block.number
    );
  }
}
