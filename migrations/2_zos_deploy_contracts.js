// Load zos scripts and truffle wrapper function
const { add, push, create, publish } = require('zos').scripts;
const runWithTruffle = require('zos').runWithTruffle;

async function deploy(options) {
    // Register Contracts
    add({ contractsData: [{ name: 'IdentityFactory', alias: 'IdentityFactory' }] });
    add({ contractsData: [{ name: 'AnchorRepository', alias: 'AnchorRepository' }] });
    add({ contractsData: [{ name: 'PaymentObligation', alias: 'PaymentObligation' }] });

    // ZOS libs do not exist on local-ganache node so deploy them
    if(options.network == "dev-99999")
        options = {...options,deployLibs: true};

    // Push implementation contracts to the network
    await push(options);

    // Publish ZOS App that manages the upgradeability
    await publish(options);

    // Create upgradable proxies
    const identityFactory = await create(Object.assign({ contractAlias: 'IdentityFactory' }, options));
    const anchorRepository = await create(Object.assign({ contractAlias: 'AnchorRepository'}, options));
    const paymentObligation = await create(Object.assign({ contractAlias: 'PaymentObligation', initMethod: 'initialize', initArgs: [anchorRepository.address] }, options));

}

module.exports = function(deployer, network, accounts) {
    deployer.then(() =>
        runWithTruffle(deploy, { network, from: accounts[0],  dontExitProcess: true })
    );
}
