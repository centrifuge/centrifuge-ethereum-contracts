pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract Identity is Ownable {
  event KeyRegistered(uint indexed kType, bytes32 indexed key);

  uint48 public centrifugeId;

  mapping(uint => bytes32[]) keys; // Indexed by Type to keys 1 (PeerToPeerID), 2 (EncryptionKey)

   constructor(uint48 _centrifugeId) public {
    require(_centrifugeId != 0x0);
    centrifugeId = _centrifugeId;
  }

  function addKey(bytes32 _key, uint256 _kType) onlyOwner public {
    require(_kType > 0);

    keys[_kType].push(_key);

    emit KeyRegistered(_kType, _key);
  }

  function getKeysByType(uint256 _kType) public view returns(bytes32[]) {
    return keys[_kType];
  }

}