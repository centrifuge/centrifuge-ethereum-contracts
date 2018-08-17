var AnchorRegistry = artifacts.require("AnchorRegistry");
var IdentityRegistry = artifacts.require("IdentityRegistry");
var IdentityFactory = artifacts.require("IdentityFactory");
var AnchorRepository = artifacts.require("AnchorRepository");

module.exports = function(deployer) {
  deployer.deploy(AnchorRegistry);
  deployer.deploy(AnchorRepository);
  deployer.deploy(IdentityRegistry).then(function(reg){
    return deployer.deploy(IdentityFactory, IdentityRegistry.address);
  });
};
