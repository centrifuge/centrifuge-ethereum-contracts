pragma solidity 0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "contracts/KeyManager.sol";
import "openzeppelin-eth/contracts/cryptography/ECDSA.sol";


contract Identity is KeyManager {
  using ECDSA for bytes32;

  constructor(address owner) public {
    // Add MANAGEMENT_KEY
    bytes32 key_ = addressToKey(owner);
    _keys[key_].purposes.push(1);
    _keys[key_].keyType = 1;
    _keysByPurpose[1].push(key_);
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
      keyHasPurpose(key_, 2),
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
