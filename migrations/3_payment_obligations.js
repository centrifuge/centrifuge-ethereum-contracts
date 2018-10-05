var IdentityRegistry = artifacts.require("IdentityRegistry");
var AnchorRepository = artifacts.require("AnchorRepository");
var PaymentObligation = artifacts.require("PaymentObligation");

module.exports = function (deployer) {
    return Promise.all([
        IdentityRegistry.deployed(),
        AnchorRepository.deployed()
    ]).then(() => {
        return deployer.deploy(PaymentObligation, "Centrifuge Payment Obligations", "CENT_PAY_OB", AnchorRepository.address, IdentityRegistry.address)
    });
};