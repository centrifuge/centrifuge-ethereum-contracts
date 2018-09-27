var AnchorRegistry = artifacts.require("AnchorRegistry");
var IdentityRegistry = artifacts.require("IdentityRegistry");
var IdentityFactory = artifacts.require("IdentityFactory");
var UserMintableERC721 = artifacts.require("UserMintableERC721");
var AnchorRepository = artifacts.require("AnchorRepository");


module.exports = function (deployer) {

    deployer.deploy(IdentityRegistry).then(() => {
        return Promise.all([
            deployer.deploy(AnchorRepository, IdentityRegistry.address),
            deployer.deploy(IdentityFactory, IdentityRegistry.address),
            deployer.deploy(AnchorRegistry).then(() => {
                // TODO figure out deployment params for NFTS
                deployer.deploy(UserMintableERC721, "ERC-721 Document Anchor", "TDA", AnchorRegistry.address, IdentityRegistry.address)
            })
        ])
    });
};
