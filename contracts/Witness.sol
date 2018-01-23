pragma solidity ^0.4.17;

contract Witness {
    mapping (bytes32 => bytes32[2]) public witness_list;

    function witnessDocument (bytes32 identifier, bytes32 merkleRoot) public {
        require(witness_list[identifier][0] == 0x0);
        witness_list[identifier] = [merkleRoot, bytes32(now)];
    }

    function getWitness (bytes32 identifier) public view returns(bytes32[2]) {
        return witness_list[identifier];
    }
}
