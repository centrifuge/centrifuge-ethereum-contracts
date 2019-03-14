pragma solidity 0.5.3;
pragma experimental ABIEncoderV2;

import "../erc721/PaymentObligation.sol";
import "contracts/Identity.sol";


contract MockPaymentObligation is  PaymentObligation {

  address private _ownAddress = address(this);
  address private _sender;
  address private _identity;

  constructor(
    address anchorRegistry,
    address identityFactory
  )
  public
  {
    PaymentObligation.initialize(
      anchorRegistry,
      identityFactory
    );
  }

  function setOwnAddress(address ownAddress)
  public
  {
    _ownAddress = ownAddress;
  }

  function _getOwnAddress()
  internal
  view
  returns (address)
  {
    return _ownAddress;
  }

  function setSender(address sender)
  public
  {
    _sender = sender;
  }

  function _getSender()
  internal
  view
  returns (address)
  {
    return _sender;
  }

  function setIdentity(address identity)
  public
  {
    _identity = identity;
  }

  function _getIdentity(address identity)
  internal
  view
  returns (Identity)
  {
    return Identity(_identity);
  }

}

