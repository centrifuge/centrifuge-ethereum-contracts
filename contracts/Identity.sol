pragma solidity ^0.4.17;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Identity is Ownable {
  event KeyRegistered(uint kType, bytes32 key);

  bytes32 public centrifugeId;

  mapping(uint => bytes32[]) keys; // Indexed by Type to keys 1 (PeerToPeerID), 2 (SignatureID)

  function Identity(bytes32 _centrifugeId) public {
    require(_centrifugeId != 0x0);
    centrifugeId = _centrifugeId;
  }

  function addKey(bytes32 _key, uint _kType) onlyOwner public {
    require(_kType > 0);

    keys[_kType].push(_key);

    KeyRegistered(_kType, _key);
  }

  function getKeysByType(uint _kType) public view returns(bytes32[]) {
    return keys[_kType];
  }

}