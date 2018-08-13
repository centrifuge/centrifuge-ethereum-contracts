pragma solidity ^0.4.24;

import './Identity.sol';
import './IdentityRegistry.sol';

contract IdentityFactory {
  event IdentityCreated(bytes32 indexed centrifugeId, address identity);

  address registry;

  constructor(address _registry) public {
    registry = _registry;
  }

  function createIdentity(bytes32 _centrifugeId) public {
    require(_centrifugeId != 0x0);
    IdentityRegistry identityRegistry = IdentityRegistry(registry);
    // Require that the centrifugeId is not already registered in the IdentityRegistry
    require(identityRegistry.getIdentityByCentrifugeId(_centrifugeId) == 0x0);

    Identity identity = new Identity(_centrifugeId);
    identity.transferOwnership(msg.sender);

    identityRegistry.registerIdentity(_centrifugeId, identity);

    emit IdentityCreated(_centrifugeId, identity);
  }

}