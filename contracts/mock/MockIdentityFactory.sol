pragma solidity 0.5.0;
import "contracts/IdentityFactory.sol";


contract MockIdentityFactory is IdentityFactory {

  function registerIdentity(
    address identity
  )
  external
  {
    _identities[identity] = true;
    emit IdentityCreated(address(identity));
  }
}
