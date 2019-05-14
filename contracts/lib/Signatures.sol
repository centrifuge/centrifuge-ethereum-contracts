pragma solidity ^0.5.3;


library Signatures {

  function consensusSignatureToEthSignedMessageHash(
    bytes32 signingRoot,
    bytes1 transitionFlag
  ) internal pure returns (bytes32)
  {
    return keccak256(
      abi.encodePacked("\x19Ethereum Signed Message:\n33", signingRoot, transitionFlag)
    );
  }

}