pragma solidity ^0.4.17;

contract Witness {
    // Why address: address is the only longer fixed length type that can be used in mapping. Otherwise we'd have to create a lookup table with mapping (bye32 => mapping (byte32 => bytes))
    mapping (bytes32 => bytes32[3]) public witness_list;
    mapping (bytes32 => bool) next_address_list;

    function witnessDocument (bytes32 version, bytes32 nextVersion, bytes32 signature) public {
        require(witness_list[version][0] == 0x0);
        require(witness_list[version][1] == 0x0);
        
        require(next_address_list[nextVersion] == false);

        next_address_list[nextVersion] = true;
        witness_list[version] = [signature, nextVersion, bytes32(now)];
    }

    function getWitness (bytes32 version) public view returns(bytes32[3]) {
        return witness_list[version];
    }
}