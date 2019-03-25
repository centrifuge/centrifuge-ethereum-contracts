var HDWalletProvider = require("truffle-hdwallet-provider");

let account = process.env.MIGRATE_ADDRESS || '0xd77c534aed04d7ce34cd425073a033db4fbe6a9d';
let endpoint = process.env.ETH_PROVIDER || "https://rinkeby.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5";
let privateKey = process.env.ETH_PRIVATE_KEY || "0xb5fffc3933d93dc956772c69b42c4bc66123631a24e3465956d80b5b604a2d13";

module.exports = {
    compilers: {
        solc: {
            version: "0.5.6",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                }
            }
        },
    },
    networks: {
        development: { // running against ganache + metamask default port
            host: "localhost",
            port: 8545,
            network_id: "*", // Match any network id
            from: "0xd77c534aed04d7ce34cd425073a033db4fbe6a9d", // Ganache first account
            gas: 6000000
        },
        localgeth: {
            host: "localhost",
            port: 9545,
            network_id: "*", // Match any network id
            from: account,
            gas: 6000000
        },
        rinkeby: {
            provider: new HDWalletProvider(privateKey, endpoint),
            port: 9545,
            network_id: "4", // rinkeby network ID
            from: account, // 0x44a0579754d6c94e7bb2c26bfa7394311cc50ccb" default address to use for any transaction Truffle makes during migrations
            gas: 4712388 // Gas limit used for deploys
        },
        kovan: {
            provider: new HDWalletProvider(privateKey, endpoint.replace('rinkeby', 'kovan')),
            port: 8545,
            network_id: "42", // kovan network ID
            from: account,
            gas: 4712388
        },
        ropsten: {
            provider: new HDWalletProvider(privateKey, endpoint.replace('rinkeby', 'ropsten')),
            port: 8545,
            network_id: "3", // ropsten network ID
            from: account,
            gas: 4712388
        }
    }
};
