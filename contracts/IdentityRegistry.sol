pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";


contract IdentityRegistry is Initializable {

  event IdentityRegistered(uint48 indexed centrifugeId, address identity);
  event IdentityUpdated(uint48 indexed centrifugeId, address identity);

  /**
   * owner -> The owner of the identity, only owners can update their own identities
   * identity -> Location of identity smart contract
   */
  struct IdentityItem {
    address owner;
    address identity;
  }

  /**
   * Throws if called by any account other than the owner of the identity.
   */
  modifier onlyIdentityOwner(uint48 _centrifugeId) {
    require(_centrifugeId != 0x0);
    require(identityRegistry[_centrifugeId].owner == msg.sender);
    _;
  }

  // Identified by centrifugeId
  mapping(uint48 => IdentityItem) identityRegistry;

  function registerIdentity(
    uint48 _centrifugeId,
    address _identity
  )
  public
  {
    require(_centrifugeId != 0x0);
    require(_identity != 0x0);
    require(identityRegistry[_centrifugeId].owner == 0x0);

    identityRegistry[_centrifugeId] = IdentityItem(msg.sender, _identity);
    emit IdentityRegistered(
      _centrifugeId,
      _identity
    );
  }

  function updateIdentityAddress(
    uint48 _centrifugeId,
    address _identity
  )
  public
  onlyIdentityOwner(_centrifugeId)
  {
    require(_centrifugeId != 0x0);
    require(_identity != 0x0);

    identityRegistry[_centrifugeId].identity = _identity;
    emit IdentityUpdated(
      _centrifugeId,
      _identity
    );
  }

  function getIdentityByCentrifugeId(uint48 _centrifugeId)
  public
  view
  returns (address identity)
  {
    return identityRegistry[_centrifugeId].identity;
  }

}
