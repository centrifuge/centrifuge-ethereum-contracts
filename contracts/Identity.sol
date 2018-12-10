pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "contracts/KeyManager.sol";
import "openzeppelin-eth/contracts/cryptography/ECDSA.sol";


contract Identity is KeyManager {
  using ECDSA for bytes32;

  constructor(address owner) public {
    // Add MANAGEMENT_KEY
    bytes32 key = addressToKey(owner);
    keys[key].purposes.push(1);
    keys[key].keyType = 1;
    keysByPurpose[1].push(key);
  }


  /**
   * @dev Proxy execution
   * @param _to address smart contract to call
   * @param _value uint256 wei supply for proxy execution
   * @param _data bytes ABI encoded call data
   */
  function execute(
    address _to,
    uint256 _value,
    bytes _data
  )
  public
  returns (bool success)
  {
    require(
      keyHasPurpose(addressToKey(msg.sender), 1) ||
      keyHasPurpose(addressToKey(msg.sender), 2),
      "Requester must have MANAGEMENT or ACTION purpose"
    );
    // solium-disable-next-line security/no-call-value
    return _to.call.value(_value)(_data);
  }

  /**
   * @dev Checks the purpose of keys used for signing
   * @param _toSign bytes32 Hash to be signed. Must be generated with abi.encodePacked(arg1, arg2, arg3)
   * @param _signature bytes Signed data
   * @param _purpose uint256 of the key
   */
  function isSignedWithPurpose(
    bytes32 _toSign,
    bytes _signature,
    uint256 _purpose
  )
  public
  view
  returns (bool valid)
  {
    bytes32 pbKey = addressToKey(
      _toSign.toEthSignedMessageHash().recover(_signature)
    );

    if (!keyHasPurpose(pbKey, _purpose) || keys[pbKey].revokedAt > 0) {
      return false;
    }
    return true;
  }
}
