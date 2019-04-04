// Load zos scripts and truffle wrapper function

const {scripts, ConfigVariablesInitializer} = require('zos');
const {add, push, create} = scripts;
const IdentityFactory = artifacts.require("IdentityFactory");
const AnchorRepository = artifacts.require("AnchorRepository");

async function deploy(options) {
    // Register Contracts

    add({contractsData: [{name: 'InvoiceUnpaidNFT', alias: 'InvoiceUnpaidNFT'}]});

    // ZOS libs do not exist on local node so deploy them
    if (options.network == "dev-99999")
        options = {...options, deployDependencies: true};
    // Push implementation contracts to the network
    await push(options);

    let tokenUriBase = process.env.TOKEN_URI_BASE ? `${process.env.TOKEN_URI_BASE}${options.network}/` : `http://metadata.centrifuge.io/invoice-unpaid/${options.network}/`;

    const unpaidInvoice = await create(Object.assign({
        contractAlias: 'InvoiceUnpaidNFT',
        initMethod: 'initialize',
        initArgs: [tokenUriBase, AnchorRepository.address, IdentityFactory.address]
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

