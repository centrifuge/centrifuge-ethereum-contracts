pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/MerkleProof.sol';
import './Identity.sol';
import './IdentityRegistry.sol';

contract AnchorRepository {

    event AnchorCommitted(address indexed from, uint256 indexed anchorId, uint48 indexed centrifugeId, bytes32 documentRoot, uint32 blockHeight);
    event AnchorPreCommitted(address indexed from, uint256 indexed anchorId, uint32 blockHeight);

    struct PreAnchor {
        bytes32 signingRoot;
        uint48 centrifugeId;
        uint32 expirationBlock;
    }
    // address for the Identity Registry
    address identityRegistry;
    // store precommits
    mapping(uint256 => PreAnchor) public preCommits;
    // store commits
    mapping(uint256 => bytes32) public commits;
    // The number of blocks for which a precommit is valid
    uint256 constant internal expirationLength = 15;

    constructor(address _identityRegistry) public {
        identityRegistry = _identityRegistry;
    }

    // @param _anchorId Id for an Anchor.
    // @param _signingRoot merkle tree for a document that does not contain the signatures
    // @param _centrifugeId Id for the Identity that wants to precommit
    // @param _signature Signed data
    function preCommit(uint256 _anchorId, bytes32 _signingRoot, uint48 _centrifugeId,  bytes _signature,  uint256 _expirationBlock) external payable {

        // not allowing empty string
        require(_anchorId != 0x0);
        require(_signingRoot != 0x0);
        // Check if _expirationBlock is within the allowed limit
        require(block.number <= _expirationBlock && _expirationBlock <= (block.number + expirationLength));

        // do not allow a precommit if there is already a valid one in place
        require(hasValidPreCommit(_anchorId) == false);

        // Construct the signed message and validate the _signature
        bytes32 message = keccak256(abi.encodePacked(_anchorId, _signingRoot, _centrifugeId, _expirationBlock));
        require(isSignatureValid(message, _centrifugeId, _signature));

        preCommits[_anchorId] = PreAnchor(_signingRoot, _centrifugeId, uint32(_expirationBlock));
        emit AnchorPreCommitted(msg.sender, _anchorId, uint32(block.number));
    }

    // @param _anchorId Id for an Anchor.
    // @param _documentRoot merkle tree for a document that will be anchored/commited. It also contains the signatures
    // @param _centrifugeId Id for the Identity that wants to commit/anchor a document
    // @param _documentProofs Array containing proofs for the document's signatures.
    // The documentRoot must be a merkle tree constructed from the signingRoot plus all signatures
    // @param _signature Signed data
    function commit(uint256 _anchorId, bytes32 _documentRoot, uint48 _centrifugeId, bytes32[] _documentProofs, bytes _signature) external payable {

        // not allowing empty string
        require(_anchorId != 0x0);
        require(_documentRoot != 0x0);
        require(_centrifugeId != 0x0);

        //not allowing to write to an existing anchor
        require(commits[_anchorId] == 0x0);

        // Check if there is a precommit and enforce it
        if(preCommits[_anchorId].expirationBlock != 0x0) {
            require(hasValidPreCommit(_anchorId) == true);
            require(MerkleProof.verifyProof(_documentProofs, _documentRoot, preCommits[_anchorId].signingRoot));
            // check that the precommit has the same _centrifugeId
            require(preCommits[_anchorId].centrifugeId == _centrifugeId);
        }

        // Construct the signed message and validate the _signature
        bytes32 message = keccak256(abi.encodePacked(_anchorId, _documentRoot, _centrifugeId));
        require(isSignatureValid(message, _centrifugeId, _signature));

        commits[_anchorId] = _documentRoot;
        emit AnchorCommitted(msg.sender, _anchorId, _centrifugeId, _documentRoot, uint32(block.number));

    }

    // @param _anchorId Id for an Anchor.
    // return Struct with anchorId, documentRoot and the centrifugeId
    function getAnchorById(uint256 _anchorId) public view returns (uint256 anchorId, bytes32 documentRoot, uint48 centrifugeId) {
        return (
        _anchorId,
        commits[_anchorId],
        preCommits[_anchorId].centrifugeId
        );
    }

    // Check if there is a valid precommit for an anchorID
    // @param _anchorId Id for an Anchor.
    // return true if there is a valid precommit for the provided anchorId
    function hasValidPreCommit(uint256 _anchorId) public view returns (bool) {
        return (preCommits[_anchorId].expirationBlock != 0x0 && preCommits[_anchorId].expirationBlock > block.number);
    }

    function isSignatureValid(bytes32 _message, uint48 _centrifugeId, bytes _signature) internal view returns (bool) {
        // get address of the identity associated to the _centrifugeId
        address identityAddress = IdentityRegistry(identityRegistry).getIdentityByCentrifugeId(_centrifugeId);
        if (identityAddress == 0x0) return false;
        return (Identity(identityAddress).isSignatureValid(_message, _signature));
    }
}
