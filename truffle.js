// openzeppelin has a bunch of good helpers for testing and they need to be compiled to with babel as they use es2015 import.
// TODO remove babel dependency when updating to v1.12.0 as they are not using babel anymore
require("babel-register")({
    ignore: /node_modules\/(?!openzeppelin-solidity)/
});
require('babel-polyfill');

//TODO Use import keys and truffle-wallet-provider module to sign txs from the code and use in networks
let account = process.env.MIGRATE_ADDRESS;

module.exports = {
    networks: {
      development: { // running against ganache + metamask default port
        host: "localhost",
        port: 8545,
        network_id: "*", // Match any network id
        from: account,
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
        host: "localhost",
        port: 9545,
        network_id: "4", // rinkeby network ID
        from: "0x44a0579754d6c94e7bb2c26bfa7394311cc50ccb", // default address to use for any transaction Truffle makes during migrations
        gas: 4612388 // Gas limit used for deploys
      }
    }
};