pragma solidity ^0.5.3;


library Signatures {

  /**
   * consensusSignatureToEthSignedMessageHash
   * @dev prefix a bytes32(docDataRoot) value and bytes1(transitionFlag) with "\x19Ethereum Signed Message:" with length 33
   * and hash the result
   */
  function consensusSignatureToEthSignedMessageHash(
    bytes32 docDataRoot,
    bytes1 transitionFlag
  ) internal pure returns (bytes32)
  {
    return keccak256(
      abi.encodePacked("\x19Ethereum Signed Message:\n33", docDataRoot, transitionFlag)
    );
  }

}