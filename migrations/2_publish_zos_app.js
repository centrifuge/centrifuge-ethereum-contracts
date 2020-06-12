// Load zos scripts and truffle wrapper function

const {scripts, ConfigManager} = require('zos');
const {publish} = scripts;

async function deploy(options) {
    // Publish ZOS App that manages the upgradeability
    await publish(options);
}

module.exports = function (deployer, networkName, accounts) {
    // Do dot run migrations in tests because we deploy the contracts we need in tests
    // Truffle will fail when you use addresses from other migrations
    if(process.env.NODE_ENV === "test") return;
    deployer.then(async () => {
        const {network, txParams} = await ConfigManager.initNetworkConfiguration({
            network: networkName,
            from: accounts[1]
        })
        await deploy({network, txParams})
    })
}


