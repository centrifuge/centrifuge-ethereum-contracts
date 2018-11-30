pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "contracts/Identity.sol";
import "contracts/IdentityRegistry.sol";


contract IdentityFactory is Initializable {
  event IdentityCreated(uint48 indexed centrifugeId, address identity);
  address registry;

  function initialize(address _registry) public initializer {
    registry = _registry;
  }

  function createIdentity(uint48 _centrifugeId) public {
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
