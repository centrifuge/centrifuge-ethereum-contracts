pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/ownership/Ownable.sol";


contract KeyManager is Ownable {

  event KeyAdded(
    bytes32 indexed key,
    uint256 indexed purpose,
    uint256 indexed keyType
  );

  event KeyRevoked(
    bytes32 indexed key,
    uint256 indexed revokedAt,
    uint256 indexed keyType
  );

  struct Key {
    // e.g., Array of the key types, like 1 = MANAGEMENT, 2 = ACTION, 3 = CLAIM, 4 = ENCRYPTION
    uint256[] purposes;
    // e.g. 1 = ECDSA, 2 = RSA, etc.
    uint256 keyType;
    // Block where key was revoked
    uint256 revokedAt;
  }

  mapping(bytes32 => Key) internal keys;

  mapping(uint256 => bytes32[]) internal keysByPurpose;

  /**
   * @param _key bytes32 public key or keccak256 hash of the public key to be added
   * @param _purpose uint representing the purpose for the public key
   * @param _keyType uint representing the type for the public key
   */
  function addKey(
    bytes32 _key,
    uint256 _purpose,
    uint256 _keyType
  )
  public
  onlyManagementOrSelf
  {

    // Can not add purpose to revoked keys
    require(keys[_key].revokedAt == 0);

    if (!keyHasPurpose(_key, _purpose)) {
      keys[_key].keyType = _keyType;
      keys[_key].purposes.push(_purpose);
      keysByPurpose[_purpose].push(_key);
      emit KeyAdded(_key, _purpose, _keyType);
    }
  }

  /**
  * @param _key bytes32 public key or keccak256 hash of the public key
  * @param _purposes Array of purposes for the public key.
  * @param _keyType uint representing the type for the public key
  */
  function addMultiPurposeKey(
    bytes32 _key,
    uint256[] _purposes,
    uint256 _keyType
  )
  public
  onlyManagementOrSelf
  {
    // key must have at least one purpose
    require(_purposes.length > 0);
    for (uint i = 0; i < _purposes.length; i++) {
      addKey(_key, _purposes[i], _keyType);
    }
  }

  /**
   * @dev Revokes a key
   * @param _key Hash of the public key to be revoked
   */
  function revokeKey(bytes32 _key)
  public
  onlyManagementOrSelf
  {
    // check if key exists
    require(keys[_key].purposes.length > 0, "Key does not exit");

    keys[_key].revokedAt = block.number;
    emit KeyRevoked(
      _key,
      keys[_key].revokedAt,
      keys[_key].keyType
    );
  }

  /**
   * @dev Retrieve details about a key
   * @param key the public key
   * @return Struct with hash of the key, purposes and revokedAt
   */
  function getKey(bytes32 _key)
  public
  view
  returns (
    bytes32 key,
    uint256[] purposes,
    uint256 revokedAt
  )
  {
    return (
    _key,
    keys[_key].purposes,
    keys[_key].revokedAt
    );
  }

  /**
   * @param _key bytes32 public key or keccak256 hash of the public key
   * @param _purpose Uint representing the purpose of the key
   * @return 'true' if the key is found and has the proper purpose
   */
  function keyHasPurpose(
    bytes32 _key,
    uint256 _purpose
  )
  public
  view
  returns (bool found)
  {

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

  /**
   * @param _purpose uint256 representing the purpose of the the key
   * @return array of hashes containing all the keys for the provided purpose
   */
  function getKeysByPurpose(uint256 _purpose)
  public
  view
  returns (bytes32[]
  )
  {
    return keysByPurpose[_purpose];
  }

  /**
   * @dev Convert an Ethereum address (20 bytes) to an ERC725 key (32 bytes)
   * by keccak256-ing it in order to avoid byte shifting and preserving privacy
   * @param addr address 20 bytes eth address
   */
  function addressToKey(address addr)
  public
  pure
  returns (bytes32)
  {
    return keccak256(abi.encodePacked(addr));
  }

  /**
   * @dev Checks if sender is either the identity contract or a MANAGEMENT key
   * @return `true` if sender is either identity contract or a MANAGEMENT key
   */
  function _managementOrSelf()
  internal
  view
  returns (bool found)
  {
    if (msg.sender == address(this)) {
      return true;
    }

    bytes32 key = addressToKey(msg.sender);
    return keyHasPurpose(key, 1);
  }


  /**
   * @dev Throws if called by any account other than self or a MANAGEMENT key.
   */
  modifier onlyManagementOrSelf() {
    require(_managementOrSelf());
    _;
  }

}
