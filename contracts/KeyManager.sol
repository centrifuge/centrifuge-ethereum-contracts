pragma solidity 0.5.3;


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

  uint256 constant internal MANAGEMENT = 1;
  uint256 constant internal ACTION = 2;

  struct Key {
    // e.g., Array of the key types, like 1 = MANAGEMENT, 2 = ACTION, 3 = CLAIM, 4 = ENCRYPTION
    uint256[] purposes;
    // e.g. 1 = ECDSA, 2 = RSA, etc.
    uint256 keyType;
    // Block where key was revoked
    uint32 revokedAt;
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
  onlyManagement
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
    uint256[] calldata purposes,
    uint256 keyType
  )
  external
  onlyManagement
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
  external
  onlyManagement
  {
    // check if key exists
    require(_keys[key].purposes.length > 0, "Key does not exit");

    _keys[key].revokedAt = uint32(block.number);
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
    uint32 revokedAt
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
   * @return keysByPurpose array of hashes containing all the keys for the provided purpose
   * @return keyTypes array of uint containing the types for the keys
   * @return keysRevokedAt array of uint containing the revocation blocks for the keys
   */
  function getKeysByPurpose(uint256 purpose)
  external
  view
  returns (bytes32[] memory keysByPurpose,uint256[] memory keyTypes, uint32[] memory keysRevokedAt)
  {
    keysByPurpose = _keysByPurpose[purpose];
    keysRevokedAt = new uint32[](keysByPurpose.length);
    keyTypes = new uint256[](keysByPurpose.length);

    for (uint i = 0; i < keysByPurpose.length; i++) {
      keysRevokedAt[i] = _keys[keysByPurpose[i]].revokedAt;
      keyTypes[i] = _keys[keysByPurpose[i]].keyType;
    }
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
   * @dev Throws if called by any account other than a MANAGEMENT key.
   */
  modifier onlyManagement() {
    bytes32 key_ = addressToKey(msg.sender);
    require(
      keyHasPurpose(key_, MANAGEMENT),
      "No management right"
    );
    _;
  }

}
