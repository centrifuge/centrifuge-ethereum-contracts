pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "contracts/Identity.sol";


contract IdentityFactory is Initializable {

  event IdentityCreated(address indexed centrifugeId);

  /**
  * Deploys a new identity and transfers the ownership to the sender
  */
  function createIdentity() public {
    Identity identity = new Identity();
    identity.transferOwnership(msg.sender);
    emit IdentityCreated(identity);
  }

  /**
  * Deploys a new identity and transfers the ownership to the provided address
  * @param owner string address owner of the new identity
  */
  function createIdentityFor(address owner) public {
    Identity identity = new Identity();
    identity.transferOwnership(owner);
    emit IdentityCreated(identity);
  }
}
