// openzeppelin has a bunch of good helpers for testing and they need to be compiled to with babel as they use es2015 import.
// TODO remove babel dependency when updating to v1.12.0 as they are not using babel anymore
const toBuffer = require("ethereumjs-util").toBuffer;

require("babel-register")({
    ignore: /node_modules\/(?!openzeppelin-solidity)/
});
require('babel-polyfill');

let account = process.env.MIGRATE_ADDRESS;
let endpoint = process.env.ETH_PROVIDER || "http://127.0.0.1:8545";
let privateKey = process.env.ETH_PRIVATE_KEY || "";

let WalletProvider = require("truffle-wallet-provider");

module.exports = {
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
                let wallet = require('ethereumjs-wallet').fromPrivateKey(toBuffer(privateKey));
                return new WalletProvider(wallet, endpoint);
            },
            port: 9545,
            network_id: "4", // rinkeby network ID
            from: account, // 0x44a0579754d6c94e7bb2c26bfa7394311cc50ccb" default address to use for any transaction Truffle makes during migrations
            gas: 4712388 // Gas limit used for deploys
        }
    }
};