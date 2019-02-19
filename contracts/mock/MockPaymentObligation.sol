pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "contracts/lib/MerkleProof.sol";
import "contracts/Identity.sol";
import "../erc721/PaymentObligation.sol";


contract MockPaymentObligation is Initializable, PaymentObligation {

  address onwAddress_ = address(this);

  function _getOwnAddress()
  internal
  view
  returns (address) {
    return onwAddress_;
  }

  function setOwnAddress(address _ownAddress)
  public
  {
    onwAddress_ = _ownAddress;
  }


  /**
   * @param _anchorRegistry address The address of the anchor registry
   * that is backing this token's mint method.
   * that ensures that the sender is authorized to mint the token
   */
  function initialize(
    address _anchorRegistry
  )
  public
  initializer
  {

    PaymentObligation.initialize(_anchorRegistry);
  }

}

