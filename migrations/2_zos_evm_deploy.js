// Load zos scripts and truffle wrapper function

const { scripts, ConfigVariablesInitializer } = require('zos');
const {add, push, create, publish} = scripts;

async function deploy(options) {
    // Register Contracts
    //add({ contractsData: [{ name: 'Identity', alias: 'Identity' }] });
    add({contractsData: [{name: 'IdentityFactory', alias: 'IdentityFactory'}]});
    add({contractsData: [{name: 'AnchorRepository', alias: 'AnchorRepository'}]});
    add({contractsData: [{name: 'InvoiceUnpaidNFT', alias: 'InvoiceUnpaidNFT'}]});

    // ZOS libs do not exist on local node so deploy them
    if ( options.network == "dev-99999" || options.network == "dev-8383")
        options = {...options, deployDependencies: true};

    // Push implementation contracts to the network
    await push(options);

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

    let tokenUriBase = process.env.TOKEN_URI_BASE ? `${process.env.TOKEN_URI_BASE}${options.network}/` : `http://metadata.centrifuge.io/invoice-unpaid/${options.network}/`;

    const unpaidInvoice = await create(Object.assign({
        contractAlias: 'InvoiceUnpaidNFT',
        initMethod: 'initialize',
        initArgs: [tokenUriBase,anchorRepository.address, identityFactory.address]
    }, options));

}

module.exports = function(deployer, networkName, accounts) {
    deployer.then(async () => {
        const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({ network: networkName, from: accounts[1] })
        await deploy({ network, txParams })
    })
}

