pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract KeyManager is Ownable {

    event KeyAdded(bytes32 indexed key, uint256 indexed purpose);
    event KeyRevoked(bytes32 indexed key, uint256 indexed revokedAt);


    // used for identifying a node
    // key is bytes32 and must not be hashed because this is used for DHT
    uint256 constant internal P2P_IDENTITY = 1;
    // used to verify that the signatures on the p2p layer belong to an identity
    // key can be bytes32 or a kecacck256 hash of a bytes64. It depends on the implementation.
    uint256 constant internal P2P_SIGNATURE = 2;
    // used for validating the author of a transaction
    // Eth uses a bytes64 public key and this should be a keccak256 of the key or an address
    // this has to mirror ETH key pairs in order to validate signatures with ecrecover
    uint256 constant internal ETH_MESSAGE_AUTH = 3;

    // Because we use different types of key pairs, bytes32 public or bytes64 public, a key can not have all 3 purposes
    // at the same time. You can only do [P2P_IDENTITY, P2P_SIGNATURE] or [P2P_SIGNATURE, ETH_MESSAGE_AUTH].
    // This is not enforced in the contract and it is up to client implementing the logic to handle this.
    struct Key {
        uint256[] purposes; // e.g., P2P_KEY = 1, SIGNING_KEY = 2, etc, MANAGEMENT_KEY = 3,
        uint256 revokedAt; // Block where key was revoked
    }

    mapping(bytes32 => Key) keys;

    mapping(uint256 => bytes32[]) keysByPurpose;

    // @param _key bytes32 public key or keccak256 hash of the public key to be added
    // @param _purpose Uint representing the purpose for the public key. Must be greater then 0
    function addKey(bytes32 _key, uint256 _purpose) onlyOwner public {
        // key must have a value
        require(_key != 0x0);
        // purpose must not be greater then 0
        require(_purpose > 0);
        // Can not add purpose to revoked keys
        require(keys[_key].revokedAt == 0);

        // Enforce that ETH_MESSAGE_AUTH can only be a address of 20 bytes

        if (!keyHasPurpose(_key, _purpose)) {
            keys[_key].purposes.push(_purpose);
            keysByPurpose[_purpose].push(_key);
            emit KeyAdded(_key, _purpose);
        }
    }

    // @param _key bytes32 public key or keccak256 hash of the public key
    // @param _purposes Array of purposes for the public key. The array must not contain 0
    function addMultiPurposeKey(bytes32 _key, uint256[] _purposes) onlyOwner public {
        // key must have at least one purpose
        require(_purposes.length > 0);
        for (uint i = 0; i < _purposes.length; i++) {
            addKey(_key, _purposes[i]);
        }
    }

    // Revokes a key
    //@param _key Hash of the public key to be revoked
    function revokeKey(bytes32 _key) onlyOwner public {
        // check if key exists
        require(keys[_key].purposes.length > 0);

        keys[_key].revokedAt = block.number;
        emit KeyRevoked(_key, keys[_key].revokedAt);
    }

    // Retrive details about a key
    // @param key the public key
    // return Struct with hash of the key, purposes and revokedAt
    function getKey(bytes32 _key) public view returns (bytes32 key, uint256[] purposes, uint256 revokedAt) {
        //if key does not exit retur  0x0 for the key
        if (keys[_key].purposes.length == 0) {
            return (
            0,
            keys[_key].purposes,
            keys[_key].revokedAt
            );
        }

        return (
        _key,
        keys[_key].purposes,
        keys[_key].revokedAt
        );
    }

    // @param _key bytes32 public key or keccak256 hash of the public key
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

}