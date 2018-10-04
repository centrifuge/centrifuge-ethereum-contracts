//TODO remove the AnchorRegistry
var AnchorRegistry = artifacts.require("AnchorRegistry");
var IdentityRegistry = artifacts.require("IdentityRegistry");
var IdentityFactory = artifacts.require("IdentityFactory");
var AnchorRepository = artifacts.require("AnchorRepository");
var PaymentObligation = artifacts.require("PaymentObligation");



module.exports = function (deployer) {
    deployer.deploy(AnchorRegistry);
    deployer.deploy(IdentityRegistry).then(() => {
        return Promise.all([
            deployer.deploy(IdentityFactory, IdentityRegistry.address),
            deployer.deploy(AnchorRepository,IdentityRegistry.address).then(() => {
                deployer.deploy(PaymentObligation, "Centrifuge Payment Obligations", "CENT_PAY_OB", AnchorRepository.address, IdentityRegistry.address)
            })
        ])
    });
};