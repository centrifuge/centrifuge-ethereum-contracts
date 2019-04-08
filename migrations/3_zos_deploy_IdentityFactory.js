// Load zos scripts and truffle wrapper function

const {scripts, ConfigVariablesInitializer} = require('zos');
const {add, push, create, publish} = scripts;

async function deploy(options) {
    // Register Contracts
    add({contractsData: [{name: 'IdentityFactory', alias: 'IdentityFactory'}]});
    // ZOS libs do not exist on local node so deploy them
    if (/dev-\d+/.test(options.network))
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
    // Do dot run migrations in tests because we deploy the contracts we need in tests
    // Truffle will fail when you use addresses from other migrations
    if(process.env.NODE_ENV === "test") return;
    deployer.then(async () => {
        const {network, txParams} = await ConfigVariablesInitializer.initNetworkConfiguration({
            network: networkName,
            from: accounts[1]
        })
        await deploy({network, txParams})
    })
}
