pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "contracts/Identity.sol";


contract IdentityFactory is Initializable {

  event IdentityCreated(address indexed identity);

  /**
  * Deploys a new identity and transfers the ownership to the sender
  */
  function createIdentity() public {
    Identity identity = new Identity(msg.sender);
    emit IdentityCreated(address(identity));
  }

  /**
  * Deploys a new identity and transfers the ownership to the provided address
  * @param owner string address owner of the new identity
  */
  function createIdentityFor(address owner) public {
    Identity identity = new Identity(owner);
    emit IdentityCreated(address(identity));
  }
}
