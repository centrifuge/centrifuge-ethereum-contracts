pragma solidity ^0.4.17;
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract AnchorRegistry is Ownable {
	event AnchorRegistered(address indexed from, bytes32 indexed identifier, bytes32 indexed rootHash, bytes32 timestamp, uint anchorSchemaVersion);
    struct Anchor {
        bytes32 identifier;
        bytes32 merkleRoot;
        bytes32 timestamp;
        uint schemaVersion;
    }

    mapping (bytes32 => Anchor) public anchors;

    function registerAnchor (bytes32 identifier, bytes32 merkleRoot, uint anchorSchemaVersion) public {
               
        //not allowing to write to an existing anchor
        require(anchors[identifier].identifier == 0x0);

        // not allowing empty string
        require(identifier != 0x0);
        require(merkleRoot != 0x0);
        
        // not allowing "null"
        // some clients will translate a *null* to a string containing "null" 
        // reject this to prevent coding errors on the user side
        require(identifier != 0x6e756c6c00000000000000000000000000000000000000000000000000000000);
        require(merkleRoot != 0x6e756c6c00000000000000000000000000000000000000000000000000000000);

        require(anchorSchemaVersion > 0);

        bytes32 timeStamp = bytes32(now);

        anchors[identifier] = Anchor(identifier, merkleRoot, timeStamp, anchorSchemaVersion);
        emit AnchorRegistered(msg.sender, identifier, merkleRoot, timeStamp, anchorSchemaVersion);
    }

    function getAnchorById (bytes32 identifier) public view returns(bytes32, bytes32, bytes32, uint) {
        return (
            anchors[identifier].identifier, 
            anchors[identifier].merkleRoot, 
            anchors[identifier].timestamp, 
            anchors[identifier].schemaVersion
            );
    }
}
