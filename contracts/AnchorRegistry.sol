pragma solidity ^0.4.17;
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract AnchorRegistry is Ownable {
	event AnchorRegistered(bytes32 identifier, bytes32 rootHash, bytes32 timestamp, uint anchorSchemaVersion);
    event RegisteringAnchor(bytes32 identifier, bytes32 rootHash, bytes32 timestamp, uint anchorSchemaVersion);

    struct Anchor {
        bytes32 identifier;
        bytes32 merkleRoot;
        bytes32 timestamp;
        uint schemaVersion;
    }

    mapping (bytes32 => Anchor) public anchors;

    function registerAnchor (bytes32 identifier, bytes32 merkleRoot, uint anchorSchemaVersion) public {
        bytes32 timeStamp = bytes32(now);
        RegisteringAnchor(identifier, merkleRoot, timeStamp, anchorSchemaVersion);
        
        //not allowing to write to an existing anchor
        require(anchors[identifier].identifier == 0x0);

        // not allowing empty string
        require(identifier != 0x0000000000000000000000000000000000000000000000000000000000000000);
        require(merkleRoot != 0x0000000000000000000000000000000000000000000000000000000000000000);
        
        // not allowing "null"
        require(identifier != 0x6e756c6c00000000000000000000000000000000000000000000000000000000);
        require(merkleRoot != 0x6e756c6c00000000000000000000000000000000000000000000000000000000);

        require(anchorSchemaVersion > 0);

        

        anchors[identifier] = Anchor(identifier, merkleRoot, timeStamp, anchorSchemaVersion);
        AnchorRegistered(identifier, merkleRoot, timeStamp, anchorSchemaVersion);
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
