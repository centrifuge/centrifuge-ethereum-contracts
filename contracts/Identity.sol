pragma solidity ^0.4.24;

import "./KeyManager.sol";
import "openzeppelin-solidity/contracts/ECRecovery.sol";

contract Identity is KeyManager {
    using ECRecovery for bytes32;

    uint48 public centrifugeId;

    constructor(uint48 _centrifugeId) public {
        require(_centrifugeId != 0x0);
        centrifugeId = _centrifugeId;
    }

    // @param _toSign Hash to be signed. Must be generated with abi.encodePacked(arg1, arg2, arg3)
    // @param _key Address/Hash of public Signature Key that belongs to Identity
    // @param _signature Signed data
    function isSignatureValid(bytes32 _toSign, bytes32 _key, bytes _signature) public view returns (bool valid) {
        if(!keyHasPurpose(_key, ETH_MESSAGE_AUTH) || keys[_key].revokedAt > 0) {
            return false;
        }
       return address(bytes20(_key)) == _toSign.toEthSignedMessageHash().recover(_signature);
    }

}