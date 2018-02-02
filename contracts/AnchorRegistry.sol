pragma solidity ^0.4.17;

contract AnchorRegistry {
    mapping (bytes32 => bytes32[2]) public anchors;

    function registerAnchor (bytes32 identifier, bytes32 merkleRoot) public {
        require(anchors[identifier][0] == 0x0);
        anchors[identifier] = [merkleRoot, bytes32(now)];
    }

    function getAnchorById (bytes32 identifier) public view returns(bytes32[2]) {
        return anchors[identifier];
    }
}
