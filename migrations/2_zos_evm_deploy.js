// Load zos scripts and truffle wrapper function
const {add, push, create, publish} = require('zos').scripts;
const runWithTruffle = require('zos').runWithTruffle;

async function deploy(options) {
    // Register Contracts
    //add({ contractsData: [{ name: 'Identity', alias: 'Identity' }] });
    add({contractsData: [{name: 'IdentityFactory', alias: 'IdentityFactory'}]});
    add({contractsData: [{name: 'AnchorRepository', alias: 'AnchorRepository'}]});
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
    const paymentObligation = await create(Object.assign({
        contractAlias: 'PaymentObligation',
        initMethod: 'initialize',
        initArgs: [anchorRepository.address, identityFactory.address]
    }, options));

}

module.exports = function (deployer, network, accounts) {
    deployer.then(async () =>
        await runWithTruffle(deploy, {network, from: accounts[0], dontExitProcess: true})
    );
}
