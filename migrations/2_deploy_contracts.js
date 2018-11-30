
// Load zos scripts and truffle wrapper function
const { add, push, create, publish } = require('zos').scripts;
const runWithTruffle = require('zos').runWithTruffle;

async function deploy(options) {
    // Register Contracts
    //add({ contractsData: [{ name: 'Identity', alias: 'Identity' }] });
    add({ contractsData: [{ name: 'IdentityRegistry', alias: 'IdentityRegistry' }] });
    add({ contractsData: [{ name: 'IdentityFactory', alias: 'IdentityFactory' }] });
    add({ contractsData: [{ name: 'AnchorRepository', alias: 'AnchorRepository' }] });
    add({ contractsData: [{ name: 'PaymentObligation', alias: 'PaymentObligation' }] });

    // ZOS libs do not exist on local node so deploy them
    if(options.network == "development")
        options = {...options,deployLibs: true};

    // Push implementation contracts to the network
    await push({network:options.network,deployLibs:true});

    // Publish ZOS App that manages the upgradeability
    await publish(options);

    // Create upgradable proxies
    const identityRegistry = await create(Object.assign({ contractAlias: 'IdentityRegistry' }, options));
    const identityFactory = await create(Object.assign({ contractAlias: 'IdentityFactory', initMethod: 'initialize', initArgs: [identityRegistry.address] }, options));
    const anchorRepository = await create(Object.assign({ contractAlias: 'AnchorRepository', initMethod: 'initialize', initArgs: [identityRegistry.address] }, options));
    const paymentObligation = await create(Object.assign({ contractAlias: 'PaymentObligation', initMethod: 'initialize', initArgs: [anchorRepository.address] }, options));

}

module.exports = function(deployer, network, accounts) {
    deployer.then(() =>
        runWithTruffle(deploy, { network, from: accounts[0],  dontExitProcess: true })
    );
}

/*module.exports = function (deployer) {
    return deployer.deploy(IdentityRegistry).then((reg) => {
        return deployer.deploy(IdentityFactory).then((factoryInstance) => {
            factoryInstance.initialize(IdentityRegistry.address);
            return deployer.deploy(AnchorRepository).then((anchorRepositoryInstance) => {
                anchorRepositoryInstance.initialize(IdentityRegistry.address);
                return deployer.deploy(PaymentObligation, AnchorRepository.address);
            });
        })
    });
};*/
