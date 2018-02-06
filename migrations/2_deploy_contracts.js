var AnchorRegistry = artifacts.require("AnchorRegistry");
var IdentityRegistry = artifacts.require("IdentityRegistry");

module.exports = function(deployer) {
  deployer.deploy(AnchorRegistry);
  deployer.deploy(IdentityRegistry);
};
