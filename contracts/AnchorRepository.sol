pragma solidity ^0.4.17;

contract AnchorRepository  {

	event AnchorCommited(address indexed from, uint256 indexed anchorId, uint256 indexed documentRoot, uint256 timestamp, uint256 centrifugeId);
	event AnchorPreCommited(address indexed from, uint256 indexed identifier, uint256 indexed singningRoot, uint256 centId, uint256 timestamp);

    struct Anchor {
        uint256 id;
        uint256 documentRoot;
        uint256 timestamp;
        uint256 centrifugeId;
    }

    struct PreAnchor {
        uint256 anchodId;
        uint256 signatureRoot;
        uint256 centrifugeId;
        uint256 expirationBlock;
    }

    mapping (uint256 => PreAnchor) public preCommits;

    mapping (uint256 => Anchor) public commits;


    function preCommit (uint256 _anchorId, uint256 _singningRoot, uint256 _centrifugeId) external payable {

        // do not allow a precommit if there is already a valid one in place
        require(hasValidPreCommit(_anchorId) == false);

        // TODO check if msg.sender is authorized to act on behalf of the centId

        preCommits[_anchorId] = PreAnchor(_anchorId, _singningRoot, _centrifugeId, block.number + 15);
        emit AnchorPreCommited(msg.sender, _anchorId, _singningRoot, _centrifugeId, now );

    }

    // Check if there is a valid precommit for an anchorID
    function hasValidPreCommit(uint256 _anchorId) public view returns (bool) {
           return (preCommits[_anchorId].expirationBlock != 0x0 && preCommits[_anchorId].expirationBlock < block.number);
    }

    function commit (uint256 _anchorId, uint256 _documentRoot, uint256 _centrifugeId) external payable {
        // in order to commit we must insure a pre commit has been done before
        require(hasValidPreCommit(_anchorId) == true);

        // TODO check if msg.sender is authorized to act on behalf of the centId


        //not allowing to write to an existing anchor
        require(commits[_anchorId].id == 0x0);

        // not allowing empty string
        require(_anchorId != 0x0);
        require(_documentRoot != 0x0);

        // not allowing "null"
        // some clients will translate a *null* to a string containing "null"
        // reject this to prevent coding errors on the user side
        require(_anchorId != 0x6e756c6c00000000000000000000000000000000000000000000000000000000);
        require(_documentRoot != 0x6e756c6c00000000000000000000000000000000000000000000000000000000);

        uint256 timestamp = now;
        commits[_anchorId] = Anchor(_anchorId, _documentRoot, timestamp, _centrifugeId);
        emit AnchorCommited(msg.sender, _anchorId, _documentRoot, timestamp, _centrifugeId);

    }

    function getAnchorById (uint256 _anchorId) public view returns(uint256, uint256, uint256, uint256) {
        return (
            commits[_anchorId].id,
            commits[_anchorId].documentRoot,
            commits[_anchorId].timestamp,
            commits[_anchorId].centrifugeId
            );
    }
}
