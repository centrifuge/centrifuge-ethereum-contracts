pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;

import "../erc721/PaymentObligation.sol";


contract MockPaymentObligation is  PaymentObligation {

  address private _ownAddress = address(this);

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

}

