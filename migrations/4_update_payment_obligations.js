const IdentityRegistry = artifacts.require("IdentityRegistry");
const AnchorRepository = artifacts.require("AnchorRepository");
const PaymentObligation = artifacts.require("PaymentObligation");

module.exports = function (deployer, network) {
    // This migration should not run anymore
    // We have a new PO and this is redundant
    // if(network == 'rinkeby')
    //     return deployer.deploy(PaymentObligation, "Centrifuge Payment Obligations", "CENT_PAY_OB", AnchorRepository.address, IdentityRegistry.address);
};
