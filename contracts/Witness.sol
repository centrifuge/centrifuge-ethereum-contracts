pragma solidity ^0.4.17;

contract Witness {
    mapping (bytes32 => bytes32[2]) public witness_list;

    function witnessDocument (bytes32 version, bytes32 merkleRoot) public {
        require(witness_list[version][0] == 0x0);
        witness_list[version] = [merkleRoot, bytes32(now)];
    }

    function getWitness (bytes32 version) public view returns(bytes32[2]) {
        return witness_list[version];
    }
}
