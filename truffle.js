module.exports = {
    networks: {
      development: {
        host: "localhost",
        port: 9545,
        network_id: "*", // Match any network id
        from: "0xd77c534aed04d7ce34cd425073a033db4fbe6a9d",
        gas: 4712388
      },
      localgeth: {
        host: "localhost",
        port: 9545,
        network_id: "*", // Match any network id
        from: "0x4b1b843af77a8f7f4f0ad2145095937e3d90e3d8",
        gas: 4712388
      },
      rinkeby: {
          host: "localhost",
          port: 8546,
          network_id: "4", // rinkeby network ID
          from: "0x96281d1d54dcdd6a68be56ba45adcc9f8ad82e44", // default address to use for any transaction Truffle makes during migrations
          gas: 4612388 // Gas limit used for deploys
        }
    }
};