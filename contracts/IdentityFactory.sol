pragma solidity 0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "contracts/Identity.sol";


contract IdentityFactory is Initializable {

  event IdentityCreated(address indexed identity);

  /**
  * @dev Keep track or identities created with the factory contract
  * This is necessary because there is no way to tell on chain
  * if the identity interface is implemented in a certain way and
  * the Centrifuge Protocol requires on chain key history. A key
  * should be revoked and not removed
  */
  mapping(address => bool) internal _identities;

  /**
  * Deploys a new identity and transfers the ownership to the sender
  */
  function createIdentity()
  external
  {
    bytes32[] memory keys_;
    uint256[] memory purposes_;
    Identity identity_ = new Identity(msg.sender, keys_, purposes_);
    address identityAddr_ = address(identity_);
    _identities[identityAddr_] = true;
    emit IdentityCreated(identityAddr_);
  }

  /**
  * Deploys a new identity with the provided address as a MANAGEMENT key
  * and the msg.sender as an ACTION key
  * @param manager string address owner of the new identity
  * @param keys bytes32[] keys to be added to the identity
  * @param purposes uint256[] purposes to be added to the identity
  */
  function createIdentityFor(
    address manager,
    bytes32[] calldata keys,
    uint256[] calldata purposes
  )
  external
  {
    Identity identity_ = new Identity(manager, keys, purposes);
    address identityAddr_ = address(identity_);
    _identities[identityAddr_] = true;
    emit IdentityCreated(address(identityAddr_));
  }

  /**
  * @dev Checks if the given address was created by this factory
  * @param identityAddr address the contract address to check
  */
  function createdIdentity(
    address identityAddr
  )
  external
  view
  returns (bool valid)
  {
    return _identities[identityAddr];
  }
}
