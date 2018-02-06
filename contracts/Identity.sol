pragma solidity ^0.4.17;
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Identity is Ownable {
  event KeyRegistered(uint keyType, bytes32 key);

  /*
   * keyType -> Type to keys 1 (PeerToPeerID), 2 (SignatureID) Could use enum but not flexible enough against changes
   * keyItems -> List of keys for a particular type (for history purposes)
   */
  struct Key {
    uint keyType;
    bytes32[] keyItems; // Multiple Keys (Do not allow deletions)
  }

  bytes32 public centrifugeId;

  mapping(uint => Key) keys;

  function Identity(bytes32 _centrifugeId) public {
    require(_centrifugeId != 0x0);
    centrifugeId = _centrifugeId;
  }

  function addKey(bytes32 _key, uint _keyType) onlyOwner public {
    require(_keyType > 0); // Do not allow int < 1

    // Key Doesn't exist by keyType
    if (keys[_keyType].keyType == 0x0) {
      keys[_keyType] = Key(_keyType, new bytes32[](0));
      keys[_keyType].keyItems.push(_key);
    } else {
      keys[_keyType].keyType = _keyType;
      keys[_keyType].keyItems.push(_key);
    }

    KeyRegistered(_keyType, _key);
  }

  function getKeysByType(uint _keyType) public view returns(bytes32[]) {
    return keys[_keyType].keyItems;
  }

}