pragma solidity 0.5.3;

import "zos-lib/contracts/Initializable.sol";
import "contracts/KeyManager.sol";
import "openzeppelin-eth/contracts/cryptography/ECDSA.sol";


contract Identity is KeyManager {
  using ECDSA for bytes32;
  /**
  * @dev Create Identity and set default keys
  * @param managementAddress address value for management key. This is the owner
  * on behalf of this identity
  * @param keys bytes32[] keys to be added to the identity
  * @param purposes uint256[] purposes to be added to the identity
  */
  constructor(
    address managementAddress,
    bytes32[] memory keys,
    uint256[] memory purposes
  )
  public
  {
    // Add MANAGEMENT_KEY
    bytes32 managementKey_ = addressToKey(managementAddress);
    _keys[managementKey_].purposes.push(MANAGEMENT);
    _keys[managementKey_].keyType = 1;
    _keysByPurpose[MANAGEMENT].push(managementKey_);


    require(
      keys.length == purposes.length,
      "Keys and purposes must have the same length"
    );

    // Add general purpose keys
    for (uint i = 0; i < purposes.length; i++) {
      bytes32 keyToAdd_ = keys[i];

      require(
        purposes[i] != MANAGEMENT,
        "Constructor can not add management keys"
      );

      _keys[keyToAdd_].purposes.push(purposes[i]);
      _keys[keyToAdd_].keyType = 1;
      _keysByPurpose[purposes[i]].push(keyToAdd_);
    }

  }

  /**
   * @dev Proxy execution
   * @param to address smart contract to call
   * @param value uint256 wei supply for proxy execution
   * @param data bytes ABI encoded call data
   */
  function execute(
    address to,
    uint256 value,
    bytes calldata data
  )
  external
  returns (bool success, bytes memory result)
  {

    bytes32 key_ = addressToKey(msg.sender);
    require(
      keyHasPurpose(key_, ACTION),
      "Requester must an ACTION purpose"
    );
    // solium-disable-next-line security/no-call-value
    return to.call.value(value)(data);
  }

  /**
   * @dev Checks the purpose of keys used for signing.
   * @param message bytes32 message to be verified. Must be generated with abi.encodePacked(arg1, arg2, arg3)
   * @param signature bytes Signed data
   * @param purpose uint256 of the key
   */
  function isSignedWithPurpose(
    bytes32 message,
    bytes memory signature,
    uint256 purpose
  )
  public
  view
  returns (bool valid)
  {
    bytes32 pbKey_ = addressToKey(
      message.toEthSignedMessageHash().recover(signature)
    );

    if (keyHasPurpose(pbKey_, purpose) && _keys[pbKey_].revokedAt == 0) {
      return true;
    }
    return false;
  }
}
