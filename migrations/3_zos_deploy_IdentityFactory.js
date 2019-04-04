// Load zos scripts and truffle wrapper function

const {scripts, ConfigVariablesInitializer} = require('zos');
const {add, push, create, publish} = scripts;

async function deploy(options) {
    // Register Contracts
    add({contractsData: [{name: 'IdentityFactory', alias: 'IdentityFactory'}]});
    // ZOS libs do not exist on local node so deploy them
    if (options.network == "dev-99999")
        options = {...options, deployDependencies: true};
    // Push implementation contracts to the network
    await push(options);
    // Create upgradable proxies
    const identityFactory = await create(Object.assign({
        contractAlias: 'IdentityFactory',
        initMethod: 'initialize'
    }, options));

}

module.exports = function (deployer, networkName, accounts) {
    deployer.then(async () => {
        const {network, txParams} = await ConfigVariablesInitializer.initNetworkConfiguration({
            network: networkName,
            from: accounts[1]
        })
        await deploy({network, txParams})
    })
}
