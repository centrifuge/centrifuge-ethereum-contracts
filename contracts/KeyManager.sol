pragma solidity 0.5.0;


contract KeyManager {

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

  mapping(bytes32 => Key) internal _keys;

  mapping(uint256 => bytes32[]) internal _keysByPurpose;

  /**
   * @param key bytes32 public key or keccak256 hash of the public key to be added
   * @param purpose uint representing the purpose for the public key
   * @param keyType uint representing the type for the public key
   */
  function addKey(
    bytes32 key,
    uint256 purpose,
    uint256 keyType
  )
  public
  onlyManagementOrSelf
  {

    // Can not add purpose to revoked keys
    require(
      _keys[key].revokedAt == 0,
      "Key is revoked"
    );

    if (!keyHasPurpose(key, purpose)) {
      _keys[key].keyType = keyType;
      _keys[key].purposes.push(purpose);
      _keysByPurpose[purpose].push(key);
      emit KeyAdded(key, purpose, keyType);
    }
  }

  /**
  * @param key bytes32 public key or keccak256 hash of the public key
  * @param purposes Array of purposes for the public key.
  * @param keyType uint representing the type for the public key
  */
  function addMultiPurposeKey(
    bytes32 key,
    uint256[] memory purposes,
    uint256 keyType
  )
  public
  onlyManagementOrSelf
  {
    // key must have at least one purpose
    require(
      purposes.length > 0,
      "Key must have at least a purpose"
    );
    for (uint i = 0; i < purposes.length; i++) {
      addKey(key, purposes[i], keyType);
    }
  }

  /**
   * @dev Revokes a key
   * @param key Hash of the public key to be revoked
   */
  function revokeKey(bytes32 key)
  public
  onlyManagementOrSelf
  {
    // check if key exists
    require(_keys[key].purposes.length > 0, "Key does not exit");

    _keys[key].revokedAt = block.number;
    emit KeyRevoked(
      key,
      _keys[key].revokedAt,
      _keys[key].keyType
    );
  }

  /**
   * @dev Retrieve details about a key
   * @param key the public key
   * @return Struct with hash of the key, purposes and revokedAt
   */
  function getKey(bytes32 keyHash)
  public
  view
  returns (
    bytes32 key,
    uint256[] memory purposes,
    uint256 revokedAt
  )
  {
    return (
    keyHash,
    _keys[keyHash].purposes,
    _keys[keyHash].revokedAt
    );
  }

  /**
   * @param key bytes32 public key or keccak256 hash of the public key
   * @param purpose Uint representing the purpose of the key
   * @return 'true' if the key is found and has the proper purpose
   */
  function keyHasPurpose(
    bytes32 key,
    uint256 purpose
  )
  public
  view
  returns (bool found)
  {

    Key memory key_ = _keys[key];
    if (key_.purposes.length == 0) {
      return false;
    }
    for (uint i = 0; i < key_.purposes.length; i++) {
      if (key_.purposes[i] == purpose) {
        return true;
      }
    }
  }

  /**
   * @param purpose uint256 representing the purpose of the the key
   * @return array of hashes containing all the keys for the provided purpose
   */
  function getKeysByPurpose(uint256 purpose)
  public
  view
  returns (bytes32[] memory)
  {
    return _keysByPurpose[purpose];
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
    return bytes32(uint256(addr));
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

    bytes32 key_ = addressToKey(msg.sender);
    return keyHasPurpose(key_, 1);
  }


  /**
   * @dev Throws if called by any account other than self or a MANAGEMENT key.
   */
  modifier onlyManagementOrSelf() {
    require(_managementOrSelf());
    _;
  }

}
