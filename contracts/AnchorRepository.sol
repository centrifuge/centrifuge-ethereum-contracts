pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/MerkleProof.sol';

contract AnchorRepository {

    event AnchorCommitted(address indexed from, uint256 indexed anchorId, uint48 indexed centrifugeId, uint256 documentRoot, uint32 blockHeight);
    event AnchorPreCommitted(address indexed from, uint256 indexed anchorId, uint32 blockHeight);

    struct Anchor {
        uint256 documentRoot;
    }

    struct PreAnchor {
        uint256 signingRoot;
        address sender;
        uint32 expirationBlock;
    }

    mapping(uint256 => PreAnchor) public preCommits;

    mapping(uint256 => Anchor) public commits;

    uint32 constant internal expirationLength = 15;

    function preCommit(uint256 _anchorId, uint256 _signingRoot) external payable {

        // not allowing empty string
        require(_anchorId != 0x0);
        require(_signingRoot != 0x0);

        // do not allow a precommit if there is already a valid one in place
        require(hasValidPreCommit(_anchorId) == false);

        // TODO check if msg.sender is authorized to act on behalf of the centrifugeId, Check Signature

        preCommits[_anchorId] = PreAnchor(_signingRoot, msg.sender, uint32(block.number) + expirationLength);
        emit AnchorPreCommitted(msg.sender, _anchorId, uint32(block.number));
    }

    // Check if there is a valid precommit for an anchorID
    function hasValidPreCommit(uint256 _anchorId) public view returns (bool) {
        return (preCommits[_anchorId].expirationBlock != 0x0 && preCommits[_anchorId].expirationBlock > block.number);
    }


    function commit(uint256 _anchorId, uint48 _centrifugeId, uint256 _documentRoot, bytes32[] _signatures) external payable {

        // not allowing empty string
        require(_anchorId != 0x0);
        require(_documentRoot != 0x0);
        require(_centrifugeId != 0x0);

        //not allowing to write to an existing anchor
        require(commits[_anchorId].documentRoot == 0x0);

        // in order to commit we must insure a pre commit has been done before
        require(hasValidPreCommit(_anchorId) == true);

        // check that the precommit has been initiated by same sender
        require(preCommits[_anchorId].sender == msg.sender);

        // TODO check if msg.sender is authorized to act on behalf of the centrifugeId, Check Signature

        require(MerkleProof.verifyProof(_signatures, bytes32(_documentRoot), bytes32(preCommits[_anchorId].signingRoot)));

        commits[_anchorId] = Anchor(_documentRoot);
        emit AnchorCommitted(msg.sender, _anchorId, _centrifugeId, _documentRoot, uint32(block.number));

    }

    function getAnchorById(uint256 _anchorId) public view returns (uint256 anchorId, uint256 documentRoot , address sender) {
        return (
        _anchorId,
        commits[_anchorId].documentRoot,
        preCommits[_anchorId].sender
        );
    }
}
