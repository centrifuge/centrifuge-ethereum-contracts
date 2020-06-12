// Load zos scripts and truffle wrapper function

const {scripts, ConfigManager} = require('zos');
const {add, push, create} = scripts;
const IdentityFactory = artifacts.require("IdentityFactory");
const AnchorRepository = artifacts.require("AnchorRepository");

async function deploy(options) {
    // Register Contracts

    add({contractsData: [{name: 'InvoiceUnpaidNFT', alias: 'InvoiceUnpaidNFT'}]});

    // ZOS libs do not exist on local node so deploy them
    if (/dev-\d+/.test(options.network))
        options = {...options, deployDependencies: true};
    // Push implementation contracts to the network
    await push(options);

    let tokenUriBase = process.env.TOKEN_URI_BASE ? `${process.env.TOKEN_URI_BASE}${options.network}/` : `http://metadata.centrifuge.io/invoice-unpaid/${options.network}/`;

    const unpaidInvoice = await create(Object.assign({
        contractAlias: 'InvoiceUnpaidNFT',
        initMethod: 'initialize',
        initArgs: [tokenUriBase, AnchorRepository.address , IdentityFactory.address]
    }, options));

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

