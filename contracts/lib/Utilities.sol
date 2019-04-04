pragma solidity ^0.5.3;


library Utilities {
  /**
 * @dev Parses bytes and extracts a bytes8 value from
 * the given starting point
 * @param payload bytes From where to extract the index
 * @param startFrom uint256 where to start from
 * @return bytes8 the index found, it defaults to 0x00000000000000
 */
  function extractIndex(
    bytes memory payload,
    uint256 startFrom
  )
  internal
  pure
  returns (
    bytes8 index
  )
  {
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      index := mload(add(add(payload, 0x20), startFrom))
    }
  }

  /**
   * @dev Parses bytes and extracts a uint256 value
   * @param payload bytes From where to extract the index
   * @return result the converted address
   */
  function bytesToUint(
    bytes memory payload
  )
  internal
  pure
  returns (
    uint256 result
  )
  {
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      result := mload(add(payload, 0x20))
    }
  }

  /**
   * @dev Parses a uint and returns the hex string
   * @param payload uint
   * @return string the corresponding hex string
   */
  function uintToHexStr(
    uint payload
  )
  internal
  pure
  returns (
    string memory
  )
  {
    if (payload == 0)
      return "0";
    // calculate string length
    uint i = payload;
    uint length;

    while (i != 0) {
      length++;
      i = i >> 4;
    }
    // parse byte by byte and construct the string
    i = payload;
    uint mask = 15;
    bytes memory result = new bytes(length);
    uint k = length - 1;

    while (i != 0) {
      uint curr = (i & mask);
      result[k--] = curr > 9 ? byte(55 + uint8(curr)) : byte(48 + uint8(curr));
      i = i >> 4;
    }

    return string(result);
  }
}
