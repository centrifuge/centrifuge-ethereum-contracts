const IdentityRegistry = artifacts.require("IdentityRegistry");
const AnchorRepository = artifacts.require("AnchorRepository");
const PaymentObligation = artifacts.require("PaymentObligation");

module.exports = function (deployer, network) {
    // On rinkeby we already have a version of the Payment Obligation
    // contract and we need to redeploy it. Ignore this migration for the rest
    if(network == 'rinkeby')
        return deployer.deploy(PaymentObligation, "Centrifuge Payment Obligations", "CENT_PAY_OB", AnchorRepository.address, IdentityRegistry.address);
};