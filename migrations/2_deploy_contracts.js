var AnchorRegistry = artifacts.require("AnchorRegistry");

module.exports = function(deployer) {
  deployer.deploy(AnchorRegistry);
};
