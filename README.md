# centrifuge Ethereum Contracts
[![Build Status](https://travis-ci.com/centrifuge/centrifuge-ethereum-contracts.svg?token=bsfbw2zXLuaTvhVTDXMh&branch=master)](https://travis-ci.com/centrifuge/centrifuge-ethereum-contracts)

**Getting help:** Head over to our developer documentation at [developer.centrifuge.io](http://developer.centrifuge.io) to learn how to setup a node and interact with it. If you have any questions, feel free to join our [slack channel](https://join.slack.com/t/centrifuge-io/shared_invite/enQtNDYwMzQ5ODA3ODc0LTU4ZjU0NDNkOTNhMmUwNjI2NmQ2MjRiNzA4MGIwYWViNTkxYzljODU2OTk4NzM4MjhlOTNjMDAwNWZkNzY2YWY) 

**DISCLAIMER:** The code released here presents a very early alpha version that should not be used in production and has not been audited. Use this at your own risk.


## Running tests
```bash

npm install 
npm run start-ganache
npm run test

```

*Migrate script will run only all migrations under the 2 prefix, keep that in mind if adding a new prefix contract migration*


## Migration

#### Development
There are 2 development environments defined: 
* development which uses ganache

```javascript
npm run start-ganache;
npm run migrate
```
* localgeth which uses go-centrifuge
```javascript
// Install and start a go-centrifuge node on port 9545
// https://github.com/centrifuge/go-centrifuge/blob/master/README.md
npm run migrate --network localgeth
```

#### ETH Test networks

Migration against ETH test networks is done using infura and truffle hd wallet and the project
contains configurations for ```rinkeby```, ```kovan``` and ```ropsten```.

Requirements:
* An account with funds for the desired network.
* Setting the ENV variables
    *  ```process.env.MIGRATE_ADDRESS // ETH account with funds```
    *  ```process.env.ETH_PRIVATE_KEY// Private Key for the ETH account```
    *  ```process.env.ETH_PROVIDER // infura end point```

Running the migration

 ```npm run migrate --network [rinkeby | kovan | ropsten]```

#### Publishing

A travis pipeline deploys the contracts to the supported test networks and publishes the artifacts to npm.

```javascript
npm install @centrifuge/ethereum-contracts
```



#### ZeppelinOS 

**All contracts,except Identity, are upgradable.**

When using the contracts the published contracts make sure to choose an appropriate Proxy. An upgradable proxy enables the user to update the master copy (aka implementation). The default upgradable proxy is managed by an admin address . 
the truffle migration scripts. 
    




