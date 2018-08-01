pragma solidity ^0.4.17;

contract AnchorRepository  {

	event AnchorCommited(address indexed from, uint256 indexed anchorId, uint256 indexed documentRoot, uint256 timestamp, uint256 centrifugeId);
	event AnchorPreCommited(address indexed from, uint256 indexed identifier, uint256 indexed singningRoot, uint256 centId, uint256 timestamp);

    struct Anchor {
        uint id;
        uint documentRoot;
        uint timestamp;
        uint centrifugeId;
    }

    struct PreCommit {
        uint anchodId;
        uint signatureRoot,
        uint centrifugeId,
        uint expirationBlock,
    }

    mapping (uint => PreCommit) public preCommits;

    mapping (uint => Anchor) public commits;


    mapping (uint256 => uint256) public commitDocumentRoot;


    function getExpirationLegth() return (uint256) {
        return 15;
    }

    function preCommit (uint256 _anchorId, uint256 _singningRoot, uint256 _centId) external payable {

        // do not allow a precommit if there is already a valid one in place
        require(hasPreCommit(_anchorId) == false);

        // TODO check if msg.sender is authorized to act on behalf of the centId

        preCommits[_anchorId] = PreCommit(_anchorId, _singningRoot, _centId, block.number + getExpirationLegth());
        AnchorPreCommited(msg.sender, _anchorId, _singningRoot, _centId, now );

    }

    // Check if there is a valid precommit for an anchorID
    function hasPreCommit(uint256 _anchorId) external view returns (bool) {
           return (preCommits[_anchorId].expirationBlock != 0x0 && preCommits[_anchorId].expirationBlock < block.number);
    }

    function commit (uint256 _anchorId, uint256 _documentRoot, uint _centId) external payable {
        // in order to commit we must insure a pre commit has been done before
        require(hasPreCommit(_anchorId) == true);

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

        timestamp = now;
        commits[_anchorId] = Anchor(_anchorId, _documentRoot, timestamp, _centrifugeId);
        AnchorCommited(msg.sender, _anchorId, _documentRoot, timestamp, _centrifugeId);

    }

    function getAnchorById (uint256 _anchorId) public view returns(uint256, uint256, uint256, uint256) {
        return (
            commits[_anchorId]._anchorId,
            commits[_anchorId]._documentRoot,
            commits[_anchorId].timestamp,
            commits[_anchorId].centrifugeId
            );
    }
}
