var HDWalletProvider = require("truffle-hdwallet-provider");

let account = process.env.MIGRATE_ADDRESS;
let endpoint = process.env.ETH_PROVIDER || "http://127.0.0.1:8545";
let privateKey = process.env.ETH_PRIVATE_KEY || "";

module.exports = {
    compilers: {
        solc: {
            version: "0.4.24"
        }
    },
    networks: {
        development: { // running against ganache + metamask default port
            host: "localhost",
            port: 8545,
            network_id: "*", // Match any network id
            from: "0xd77c534aed04d7ce34cd425073a033db4fbe6a9d", // Ganache first account
        },
        localgeth: {
            host: "localhost",
            port: 9545,
            network_id: "*", // Match any network id
            from: account,
            gas: 4712388
        },
        rinkeby: {
            provider: () => {
                return new HDWalletProvider(privateKey, endpoint);
            },
            port: 9545,
            network_id: "4", // rinkeby network ID
            from: account, // 0x44a0579754d6c94e7bb2c26bfa7394311cc50ccb" default address to use for any transaction Truffle makes during migrations
            gas: 4712388 // Gas limit used for deploys
        },
        kovan: {
            provider: () => {
                return new HDWalletProvider(privateKey, endpoint.replace('rinkeby', 'kovan'));
            },
            port: 8545,
            network_id: "42", // kovan network ID
            from: account,
            gas: 4712388
        },
        ropsten: {
            provider: () => {
                return new HDWalletProvider(privateKey, endpoint.replace('rinkeby', 'ropsten'));
            },
            port: 8545,
            network_id: "3", // ropsten network ID
            from: account,
            gas: 4712388
        }
    }
};
