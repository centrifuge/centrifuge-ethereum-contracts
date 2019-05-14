pragma solidity ^0.5.3;

import "contracts/lib/Signatures.sol";


contract SignaturesWrapper {

  function consensusSignatureToEthSignedMessageHash(
    bytes32 signingRoot,
    bytes1 transitionFlag
  ) public view returns (bytes32)
  {
    return Signatures.consensusSignatureToEthSignedMessageHash(
      signingRoot,
      transitionFlag
    );
  }

}