pragma solidity ^0.4.24;

import "./KeyManager.sol";
import "openzeppelin-solidity/contracts/ECRecovery.sol";

contract Identity is KeyManager {
    using ECRecovery for bytes32;

    uint48 public centrifugeId;

    bytes constant internal ETH_PREFIX = "\x19Ethereum Signed Message:\n32";

    constructor(uint48 _centrifugeId) public {
        require(_centrifugeId != 0x0);
        centrifugeId = _centrifugeId;
    }

    // TODO - Decide on how we implement signatures. This is a draft using web3.eth.sign that enforces eth address / bytes20 for public keys
    // @param _toSign Hash to be signed. Must be generated with abi.encodePacked(arg1, arg2, arg3)
    // @param _key Hash of public Signature Key that belongs to Identity
    // @param _signature Signed data
    function isSignatureValid(bytes32 _toSign, bytes32 _key, bytes _signature) public view returns (bool valid) {
        if(!keyHasPurpose(_key, SIGNING_KEY) || keys[_key].revokedAt > 0) {
            return false;
        }
       return _key == (bytes32(keccak256(abi.encodePacked(ETH_PREFIX, _toSign)).recover(_signature)) << 96);
    }

}