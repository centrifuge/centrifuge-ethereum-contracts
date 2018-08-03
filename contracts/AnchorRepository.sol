pragma solidity ^0.4.17;

contract AnchorRepository  {

	event AnchorCommitted(address indexed from, uint256 indexed anchorId, uint256 indexed documentRoot, uint256 centrifugeId, uint256 timestamp);
	event AnchorPreCommitted(address indexed from, uint256 indexed identifier, uint256 indexed singningRoot, uint256 timestamp);

    struct Anchor {
        uint256 documentRoot;
        uint128 centrifugeId;
        uint32 timestamp;
    }

    struct PreAnchor {
        uint256 anchorId;
        uint256 signatureRoot;
        address sender;
        uint32 expirationBlock;
    }

    mapping (uint256 => PreAnchor) public preCommits;

    mapping (uint256 => Anchor) public commits;


    // Returns the number of blocks that a precommit is valid
    function getExpirationLeght() internal pure returns (uint32) {
        return 15;
    }

    function preCommit (uint256 _anchorId, uint256 _singningRoot) external payable {

        // not allowing empty string
        require(_anchorId != 0x0);
        require(_singningRoot != 0x0);

        // do not allow a precommit if there is already a valid one in place
        require(hasValidPreCommit(_anchorId) == false);

        // TODO check if msg.sender is authorized to act on behalf of the centrifugeIdå

        preCommits[_anchorId] = PreAnchor( _anchorId ,_singningRoot, msg.sender , uint32(block.number) + getExpirationLeght());
        emit AnchorPreCommitted(msg.sender, _anchorId, _singningRoot, now );
    }

    // Check if there is a valid precommit for an anchorID
    function hasValidPreCommit(uint256 _anchorId) public view returns (bool) {
           return (preCommits[_anchorId].expirationBlock != 0x0 && preCommits[_anchorId].expirationBlock > block.number);
    }

    function commit (uint256 _anchorId, uint256 _documentRoot, uint128 _centrifugeId) external payable {

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

         // TODO check if msg.sender is authorized to act on behalf of the centrifugeId

        uint32 timestamp = uint32(now);
        commits[_anchorId] = Anchor(_documentRoot, _centrifugeId, timestamp);
        emit AnchorCommitted(msg.sender, _anchorId, _documentRoot,  _centrifugeId, timestamp);

    }

   function getAnchorById (uint256 _anchorId) public view returns(uint256 anchorId, uint256 docuemntRoot, uint256 centrifugeId, uint256 timestamp) {
           return (
               _anchorId,
               commits[_anchorId].documentRoot,
               commits[_anchorId].centrifugeId,
               commits[_anchorId].timestamp
               );
       }
}
