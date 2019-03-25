pragma solidity ^0.5.6;


/*
 * @title MerkleProof
 * @dev Merkle proof verification based on
 * https://github.com/ameensol/merkle-tree-solidity/blob/master/src/MerkleProof.sol
 */
library MerkleProof {
  /*
   * @dev Verifies a Merkle proof proving the existence of a leaf in a Merkle tree. Assumes that each pair of leaves
   * and each pair of pre-images is sorted.
   * @param bytes32[] proof Merkle proof containing sibling hashes on the branch from the leaf to the root of the Merkle tree
   * @param bytes32 root Merkle root
   * @param bytes32 leaf Leaf of Merkle tree
   */
  function verifySha256(
    bytes32[] memory proof,
    bytes32 root,
    bytes32 leaf
  )
    internal
    pure
    returns (bool)
  {
    // Do not allow empty _proof arrays
    if (proof.length == 0)
      return false;
    bytes32 computedHash_ = leaf;
    for (uint256 i = 0; i < proof.length; i++) {
      bytes32 proofElement_ = proof[i];

      if (computedHash_ < proofElement_) {
        // Hash(current computed hash + current element of the proof)
        computedHash_ = sha256(abi.encodePacked(computedHash_, proofElement_));
      } else {
        // Hash(current element of the proof + current computed hash)
        computedHash_ = sha256(abi.encodePacked(proofElement_, computedHash_));
      }
    }

    // Check if the computed hash (root) is equal to the provided root
    return computedHash_ == root;
  }

  /*
   * @dev Verifies a Merkle proof proving the existence of a leaf in a Merkle tree. Assumes that each pair of leaves
   * and each pair of pre-images is sorted.
   * @param proof Merkle proof containing sibling hashes on the branch from the leaf to the root of the Merkle tree
   * @param root Merkle root
   * @param leaf Leaf of Merkle tree
   */
  function verifySha256(
    bytes32 proof,
    bytes32 root,
    bytes32 leaf
  )
  internal
  pure
  returns (bool)
  {
    // Do not allow empty _proof arrays
    if (proof.length == 0)
      return false;
    bytes32 computedHash_ = leaf;
    if (computedHash_ < proof) {
      // Hash(current computed hash + current element of the proof)
      computedHash_ = sha256(abi.encodePacked(computedHash_, proof));
    } else {
      // Hash(current element of the proof + current computed hash)
      computedHash_ = sha256(abi.encodePacked(proof, computedHash_));
    }

    // Check if the computed hash (root) is equal to the provided root
    return computedHash_ == root;
  }

  function verify(
    bytes32[] memory proof,
    bytes32 root,
    bytes32 leaf
  )
  internal
  pure
  returns (bool)
  {
    // Do not allow empty _proof arrays
    if (proof.length == 0)
      return false;
    bytes32 computedHash_ = leaf;

    for (uint256 i = 0; i < proof.length; i++) {
      bytes32 proofElement_ = proof[i];

      if (computedHash_ < proofElement_) {
        // Hash(current computed hash + current element of the proof)
        computedHash_ = keccak256(abi.encodePacked(computedHash_, proofElement_));
      } else {
        // Hash(current element of the proof + current computed hash)
        computedHash_ = keccak256(abi.encodePacked(proofElement_, computedHash_));
      }
    }

    // Check if the computed hash (root) is equal to the provided root
    return computedHash_ == root;
  }
}
