pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "contracts/Identity.sol";


contract IdentityFactory is Initializable {

  event IdentityCreated(address indexed centrifugeId);
  function createIdentity() public {
    Identity identity = new Identity();
    identity.transferOwnership(msg.sender);
    emit IdentityCreated(identity);
  }
}
