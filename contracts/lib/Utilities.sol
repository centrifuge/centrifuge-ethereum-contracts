pragma solidity ^0.5.3;

import "openzeppelin-eth/contracts/cryptography/ECDSA.sol";
import "contracts/lib/Signatures.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";


library Utilities {
  using ECDSA for bytes32;
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
   * @dev Parses a uint to Hex String padding with leading 0s to the desired length
   * @param payload uint of data
   * @param size desired string length
   * @return hex string result
   */
  function uintToHexStrPadded(
    uint payload,
    uint size
  )
  internal
  pure
  returns (
    string memory
  )
  {
    if (payload == 0)
      return "00";
    // calculate string length
    uint i = payload;
    uint length;

    while (i != 0) {
      length++;
      i = i >> 4;
    }

    if (length > (size*2)) {
      return "00";
    }

    bytes memory result = new bytes(size*2);
    // parse byte by byte and construct the string
    i = payload;
    uint mask = 15;
    uint k = (size*2) - 1;

    while (i != 0) {
      uint curr = (i & mask);
      result[k--] = curr > 9 ? byte(55 + uint8(curr)) : byte(48 + uint8(curr));
      i = i >> 4;
    }

    uint j;
    while (j < ((size*2)-length)) {
      result[j++] = byte(uint8(48));
    }

    return string(result);
  }

  /**
 * @dev Extracts public key from signature and payload for consensus signing (signature+transitionValidation)
 * @param signature bytes of signature
 * @param docDataRoot bytes32 of signed data
 * @return byte32 of public key
 * @return bool true if success, false otherwise
 */
  function recoverPublicKeyFromConsensusSignature(
    bytes memory signature,
    bytes32 docDataRoot
  )
  internal
  pure
  returns (
    bytes32
  )
  {
    if (signature.length != 66) {
      return 0;
    }

    bytes memory signatureOnly = BytesLib.slice(signature, 0, (signature.length-1));

    // Extract the public key from the signature
    return bytes32(
      uint256(
        Signatures.consensusSignatureToEthSignedMessageHash(docDataRoot, signature[signature.length-1]).recover(signatureOnly)
      )
    );
  }

}
