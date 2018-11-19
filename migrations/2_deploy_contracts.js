const AnchorRegistry = artifacts.require("AnchorRegistry");
const IdentityRegistry = artifacts.require("IdentityRegistry");
const IdentityFactory = artifacts.require("IdentityFactory");
const AnchorRepository = artifacts.require("AnchorRepository");
const PaymentObligation = artifacts.require("PaymentObligation");

module.exports = function (deployer) {
    deployer.deploy(AnchorRegistry).then(() => {
        return deployer.deploy(IdentityRegistry).then((reg) => {
            return deployer.deploy(IdentityFactory, IdentityRegistry.address).then(() => {
                return deployer.deploy(AnchorRepository, IdentityRegistry.address).then(() => {
                    return deployer.deploy(PaymentObligation, "Centrifuge Payment Obligations", "CENT_PAY_OB", AnchorRepository.address, IdentityRegistry.address);
                });
            })
        })
    });
};
