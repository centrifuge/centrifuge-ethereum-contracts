var HDWalletProvider = require("truffle-hdwallet-provider");

// openzeppelin has a bunch of good helpers for testing and they need to be compiled to with babel as they use es2015 import.
// TODO remove babel dependency when updating to v1.12.0 as they are not using babel anymore


require("babel-register")({
    ignore: /node_modules\/(?!openzeppelin-solidity)/
});
require('babel-polyfill');

let account = "0xd77c534aed04d7ce34cd425073a033db4fbe6a9d";
let endpoint = "https://rinkeby.infura.io/v3/61181d6472cb498dbefd50537aa1b4fd" || "http://127.0.0.1:8545";
let privateKey = "0xb5fffc3933d93dc956772c69b42c4bc66123631a24e3465956d80b5b604a2d13" || "";

// let account = process.env.MIGRATE_ADDRESS;
// let endpoint = process.env.ETH_PROVIDER || "http://127.0.0.1:8545";
// let privateKey = process.env.ETH_PRIVATE_KEY || "";

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
            gas: 4712388
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
        }
    }
};
