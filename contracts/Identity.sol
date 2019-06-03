pragma solidity ^0.5.3;

import "zos-lib/contracts/Initializable.sol";
import "contracts/KeyManager.sol";
import "openzeppelin-eth/contracts/cryptography/ECDSA.sol";


contract Identity is KeyManager {
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
    // Check that own address is not a managementKey
    require(
      managementAddress != address(this),
      "Own address can not be a management key"
    );

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
    bytes memory data
  ) onlyAction
  public
  payable
  returns (bool success)
  {
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      // check if contract to be called exists
      if iszero(extcodesize(to)) {
        revert(0, 0)
      }
      success := call(gas, to, value, add(data, 0x20), mload(data), 0, 0)
    }
  }
  /**
   * @dev Transfer eth
   * @param to address of account where to transfer eth.
   * it can not be a contract. Use execute method in that case
   * @param value uint256 wei supply for proxy execution
   * @param data bytes ABI encoded call data
   */
  function transferEth(
    address to,
    uint256 value,
    bytes memory data
  ) onlyAction
  public
  payable
  returns (bool success)
  {
    // solium-disable-next-line security/no-inline-assembly
    assembly {
    // Make sure the address is not a contract
      if gt(extcodesize(to),0) {
        revert(0, 0)
      }
      success := call(gas, to, value, add(data, 0x20), mload(data), 0, 0)
    }
  }



}
