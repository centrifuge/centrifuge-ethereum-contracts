// Load zos scripts and truffle wrapper function

const {scripts, ConfigVariablesInitializer} = require('zos');
const {publish} = scripts;

async function deploy(options) {
    // Publish ZOS App that manages the upgradeability
    await publish(options);
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


