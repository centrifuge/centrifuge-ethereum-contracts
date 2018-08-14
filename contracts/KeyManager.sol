pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract KeyManager is Ownable {

    event KeyAdded(bytes32 indexed key, uint8[] purposes);
    event KeyRevoked(bytes32 indexed key, uint32 revokedAt, uint8[] purposes);

    // used or KeyManagement.
    // They can add and remoke keys
    // They must be the address of the sender
    uint8 constant internal MANAGEMENT_KEY = 1;
    // used for identifying a node
    uint8 constant internal P2P_KEY = 2;
    // used for signing messages
    uint8 constant internal SIGNING_KEY = 3;

    struct Key {
        uint8[] purposes; // e.g.,MANAGEMENT_KEY = 1, P2P_KEY = 2, SIGNING_KEY = 3, etc.
        uint32 revokedAt; // Block where key was revoked
    }

    mapping(uint256 => Key) keys;

    mapping(uint8 => bytes32[]) keysByPurpose;

    // @param _key Hash of the public key to be added
    // @param _purposes Array of purposes for the public key
    function add(bytes32 _key, uint8[] _purposes) onlyOwner public {
        // key must have at least one purpose
        require(_purposes.length > 0);

        keys[_key] = Key(_purposes, false);
        for (uint i = 0; i < _purposes.length; i++) {
            keysByPurpose[_purposes[i]].push(_key);
        }
        emit KeyAdded(_key, _purposes);
    }

    // Revokes a key
    //@param _key Hash of the public key to be revoked
    function revoke(uint256 _key) onlyOwner public {
        // check if key exists
        require(keys[_key].purposes != 0x0);

        keys[_key].revokedAt = uint32(block.number);
        emit KeyRevoked(_key, keys[_key].revokedAt, keys[_key]._purposes);
    }

    // @param _key Hash of public key
    // @param _purpose Uint representing the purpose of the key
    // @return 'true' if the key is found and has the proper purpose
    function keyHasPurpose(bytes32 _key, uint8 _purpose) public view returns (bool found) {
        Key memory k = keys[_key];
        if (k.key == 0) {
            return false;
        }
        for (uint i = 0; i < k.purposes.length; i++) {
            if (k.purposes[i] == purpose) {
                found = true;
                return;
            }
        }
    }

    // @param purpose Uint representing the purpose of the the key
    // @return array of hashes containing all the keys for the provided purpose
    function getKeysByPurpose(uint8 _purpose) public view returns (bytes[32] keys) {
        return keysByPurpose[_purpose];
    }

    // Checks if the sender is the owner of the identity or a MANAGEMENT_KEY
    modifier onlyManagementOrOwner() {
        if (msg.sender == owner) {
            revert();
        }
        require(keyHasPurpose(bytes32(msg.sender), MANAGEMENT_KEY));
        _;
    }
}