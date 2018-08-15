pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract KeyManager is Ownable {

    event KeyAdded(bytes32 indexed key, uint256[] purposes);
    event KeyRevoked(bytes32 indexed key, uint256 revokedAt, uint256[] purposes);

    // used or KeyManagement.
    // They can add and remoke keys
    // They must be the address of the sender
    uint256 constant internal MANAGEMENT_KEY = 1;
    // used for identifying a node
    uint256 constant internal P2P_KEY = 2;
    // used for signing messages
    uint256 constant internal SIGNING_KEY = 3;

    struct Key {
        uint256[] purposes; // e.g.,MANAGEMENT_KEY = 1, P2P_KEY = 2, SIGNING_KEY = 3, etc.
        uint256 revokedAt; // Block where key was revoked
    }

    mapping(bytes32 => Key) keys;

    mapping(uint256 => bytes32[]) keysByPurpose;

    // @param _key Hash of the public key to be added
    // @param _purposes Array of purposes for the public key
    function addKey(bytes32 _key, uint256[] _purposes) onlyManagementOrOwner public {
        // key must have a value
        require(_key != 0x0);
        // key must have at least one purpose
        require(_purposes.length > 0);

        keys[_key] = Key(_purposes, 0);
        for (uint i = 0; i < _purposes.length; i++) {
            keysByPurpose[_purposes[i]].push(_key);
        }
        emit KeyAdded(_key, _purposes);
    }

    // Revokes a key
    //@param _key Hash of the public key to be revoked
    function revokeKey(bytes32 _key) onlyManagementOrOwner public {
        // check if key exists
        require(keys[_key].purposes.length > 0);

        keys[_key].revokedAt = block.number;
        emit KeyRevoked(_key, keys[_key].revokedAt, keys[_key].purposes);
    }

    // Retrive details about a key
    // @param key  Hash of public key
    // return Struct with hash of the key, purposes and revokedAt
    function getKey(bytes32 _key) public view returns (bytes32 key, uint256[] purposes, uint256 revokedAt) {
        return (
        _key,
        keys[_key].purposes,
        keys[_key].revokedAt
        );
    }

    // @param _key Hash of public key
    // @param _purpose Uint representing the purpose of the key
    // @return 'true' if the key is found and has the proper purpose
    function keyHasPurpose(bytes32 _key, uint256 _purpose) public view returns (bool found) {

        Key memory k = keys[_key];
        if (k.purposes.length == 0) {
            return false;
        }
        for (uint i = 0; i < k.purposes.length; i++) {
            if (k.purposes[i] == _purpose) {
                found = true;
                return;
            }
        }
    }

    // @param purpose Uint representing the purpose of the the key
    // @return array of hashes containing all the keys for the provided purpose
    function getKeysByPurpose(uint256 _purpose) public view returns (bytes32[]) {
        return keysByPurpose[_purpose];
    }

    // Checks if the sender is the owner of the identity or a MANAGEMENT_KEY
    modifier onlyManagementOrOwner() {
        require(msg.sender == owner || keyHasPurpose(bytes32(msg.sender) << 96, MANAGEMENT_KEY));
        _;
    }
}