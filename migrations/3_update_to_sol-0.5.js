const IdentityFactory = artifacts.require("IdentityFactory");
const AnchorRepository = artifacts.require("AnchorRepository");
const PaymentObligation = artifacts.require("PaymentObligation");

module.exports = function (deployer) {
    return deployer.deploy(IdentityFactory).then(() => {
        return deployer.deploy(AnchorRepository).then(() => {
            return deployer.deploy(PaymentObligation).then((poInstance) => {
                return poInstance.initialize(AnchorRepository.address)
            });
        });
    })
};
