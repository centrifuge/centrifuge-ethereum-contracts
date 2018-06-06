module.exports = {
    networks: {
      development: {
        host: "localhost",
        port: 8545,
        network_id: "*", // Match any network id
        from: "0x45b9c4798999ffa52e1ff1efce9d3e45819e4158",
        gas: 4712388
      },
      localgeth: {
        host: "localhost",
        port: 9545,
        network_id: "*", // Match any network id
        from: "0x45b9c4798999ffa52e1ff1efce9d3e45819e4158",
        gas: 4712388
      },
      integration: {
        host: "localhost",
        port: 9545,
        network_id: "*", // Match any network id
        from: "0x45b9c4798999ffa52e1ff1efce9d3e45819e4158",
        gas: 4712388
      },
      rinkeby: {
        host: "localhost",
        port: 8545,
        network_id: "4", // rinkeby network ID
        from: "0x44a0579754d6c94e7bb2c26bfa7394311cc50ccb", // default address to use for any transaction Truffle makes during migrations
        gas: 4612388 // Gas limit used for deploys
      }
    }
};