pragma solidity ^0.5.7;

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


  function uintToHexStr(
    uint payload
  )
  public
  view
  returns (
    string memory
  )
  {
    return Utilities.uintToHexStr(
      payload
    );
  }
}
