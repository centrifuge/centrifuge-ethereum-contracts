const AnchorRegistry = artifacts.require("AnchorRegistry");
const IdentityRegistry = artifacts.require("IdentityRegistry");
const IdentityFactory = artifacts.require("IdentityFactory");
const AnchorRepository = artifacts.require("AnchorRepository");

module.exports = function (deployer) {
    deployer.deploy(AnchorRegistry);
    deployer.deploy(IdentityRegistry).then(function (reg) {
        return Promise.all([
            deployer.deploy(AnchorRepository, IdentityRegistry.address),
            deployer.deploy(IdentityFactory, IdentityRegistry.address)
        ])
    });
};