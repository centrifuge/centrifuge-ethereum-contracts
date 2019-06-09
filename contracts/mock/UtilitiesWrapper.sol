pragma solidity ^0.5.3;

import "contracts/lib/Utilities.sol";


contract UtilitiesWrapper {

  function extractIndex(
    bytes memory payload,
    uint256 startFrom
  )
  public
  view
  returns (
    bytes8 index
  )
  {
    return Utilities.extractIndex(
        payload,
        startFrom
    );
  }

  function bytesToUint(
    bytes memory payload
  )
  public
  view
  returns (
    uint256 result
  )
  {
    return Utilities.bytesToUint(
      payload
    );
  }

  function uintToHexStrPadded(
    uint payload,
    uint size
  )
  public
  view
  returns (
    string memory
  )
  {
    return Utilities.uintToHexStrPadded(
      payload,
      size
    );
  }

  function removeLastElement(
    bytes memory array
  )
  public
  view
  returns (
    bytes memory
  )
  {
    return Utilities.removeLastElement(array);
  }


  function recoverPublicKeyFromConsensusSignature(
    bytes memory signature,
    bytes32 docDataRoot
  )
  public
  view
  returns (
    bytes32,
    bool
  )
  {
    return Utilities.recoverPublicKeyFromConsensusSignature(signature, docDataRoot);
  }

}
