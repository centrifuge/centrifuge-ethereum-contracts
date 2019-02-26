pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "contracts/lib/MerkleProof.sol";
import "contracts/Identity.sol";
import "../erc721/PaymentObligation.sol";


contract MockPaymentObligation is Initializable, PaymentObligation {

  address private _ownAddress = address(this);

  /**
   * @param registry address The address of the anchor registry
   * that is backing this token's mint method.
   * that ensures that the sender is authorized to mint the token
   */
  function initialize(
    address registry
  )
  public
  initializer
  {

    PaymentObligation.initialize(registry);
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

