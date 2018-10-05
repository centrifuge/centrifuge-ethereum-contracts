var AnchorRegistry = artifacts.require("AnchorRegistry");
var IdentityRegistry = artifacts.require("IdentityRegistry");
var IdentityFactory = artifacts.require("IdentityFactory");
var AnchorRepository = artifacts.require("AnchorRepository");

module.exports = function (deployer) {
    deployer.deploy(AnchorRegistry);
    deployer.deploy(IdentityRegistry).then(function (reg) {
        return Promise.all([
            deployer.deploy(AnchorRepository, IdentityRegistry.address),
            deployer.deploy(IdentityFactory, IdentityRegistry.address)
        ])
    });
};