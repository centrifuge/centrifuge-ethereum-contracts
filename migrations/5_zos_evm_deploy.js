// Load zos scripts and truffle wrapper function
const {add, push, create, publish} = require('zos').scripts;
const runWithTruffle = require('zos').runWithTruffle;

async function deploy(options) {
    // Register Contracts
    //add({ contractsData: [{ name: 'Identity', alias: 'Identity' }] });
    add({contractsData: [{name: 'IdentityFactory', alias: 'IdentityFactory'}]});
    add({contractsData: [{name: 'AnchorRepository', alias: 'AnchorRepository'}]});
    add({contractsData: [{name: 'UserMintableERC721', alias: 'UserMintableERC721'}]});
    add({contractsData: [{name: 'PaymentObligation', alias: 'PaymentObligation'}]});

    // ZOS libs do not exist on local node so deploy them
    if (options.network == "development")
        options = {...options, deployLibs: true};

    // Push implementation contracts to the network
    await push({network: options.network, deployLibs: true});

    // Publish ZOS App that manages the upgradeability
    await publish(options);

    // Create upgradable proxies
    const identityFactory = await create(Object.assign({
        contractAlias: 'IdentityFactory',
        initMethod: 'initialize'
    }, options));
    const anchorRepository = await create(Object.assign({
        contractAlias: 'AnchorRepository',
        initMethod: 'initialize'
    }, options));
    const userMintableERC721 = await create(Object.assign({
        contractAlias: 'UserMintableERC721',
        initMethod: 'initialize',
        initArgs: ["Centrifuge Payment Obligations", "CENT_PAY_OB", anchorRepository.address]
    }, options));
    const paymentObligation = await create(Object.assign({
        contractAlias: 'PaymentObligation',
        initMethod: 'initialize',
        initArgs: [userMintableERC721.address]
    }, options));

}

module.exports = function (deployer, network, accounts) {
    deployer.then(async () =>
       await runWithTruffle(deploy, {network, from: accounts[0], dontExitProcess: true})
    );
}

// const IdentityFactory = artifacts.require("IdentityFactory");
// const AnchorRepository = artifacts.require("AnchorRepository");
// const PaymentObligation = artifacts.require("PaymentObligation");
//
// module.exports = function (deployer) {
//     return deployer.deploy(IdentityFactory).then(() => {
//         return deployer.deploy(AnchorRepository).then(() => {
//             return deployer.deploy(PaymentObligation).then((poInstance) => {
//                 return poInstance.initialize(AnchorRepository.address)
//             });
//         });
//     })
// };
