# centrifuge Ethereum Contracts
[![Build Status](https://travis-ci.com/centrifuge/centrifuge-ethereum-contracts.svg?token=bsfbw2zXLuaTvhVTDXMh&branch=master)](https://travis-ci.com/centrifuge/centrifuge-ethereum-contracts)

**Getting help:** Head over to our developer documentation at [developer.centrifuge.io](http://developer.centrifuge.io) to learn how to setup a node and interact with it. If you have any questions, feel free to join our [slack channel](https://join.slack.com/t/centrifuge-io/shared_invite/enQtNDYwMzQ5ODA3ODc0LTU4ZjU0NDNkOTNhMmUwNjI2NmQ2MjRiNzA4MGIwYWViNTkxYzljODU2OTk4NzM4MjhlOTNjMDAwNWZkNzY2YWY) 

**DISCLAIMER:** The code released here presents a very early alpha version that should not be used in production and has not been audited. Use this at your own risk.


## Running it
```bash

# install the repo dependencies
npm install 

# run testrpc with fixed mnmonic
npm run start-ganache

# to run tests
npm run test

# to continuously run tests, if you so choose
npm run re-test
```

*Migrate script will run only all migrations under the 2 prefix, keep that in mind if adding a new prefix contract migration*

## Migrate Smart Contracts against Integration Environment

Follow instructions under https://github.com/centrifuge/go-centrifuge/blob/master/README.md to deploy a local light node that bootstraps from the remote node.
As soon as the local node is running, and synced:
* Copy `migrateAccount.json` file to your $ETH_DATADIR/$NETWORK_ID/keystore
* Perform migration `./scripts/migrate.sh integration`
  * Unlocks default account
  * Runs truffle migrate
  * Generates environment json file


## Migrate Smart Contracts against Rinkeby Environment

Follow instructions under https://github.com/CentrifugeInc/go-centrifuge/blob/master/README.md to deploy a local light Rinkeby node.
As soon as the local proxy node is running:
* Unlock migrate account:
  * Binary run:
    ```
    geth attach http://localhost:9545 --exec "personal.unlockAccount('0x44a0579754d6c94e7bb2c26bfa7394311cc50ccb', 'INPUT_PWD', 500)"
    ```
  * Docker run:
     ```
     docker run -it --net=host --entrypoint "/geth" centrifugeio/cent-geth:latest attach http://localhost:9545 --exec "personal.unlockAccount('0x44a0579754d6c94e7bb2c26bfa7394311cc50ccb', 'INPUT_PWD', 500)"
     ```
* Perform migration `./scripts/migrate.sh rinkeby`
  * Runs truffle migrate
  * Generates environment json file


## Released ABIs + Addresses

We keep track of the released ABIs and their respective deployed addresses as part of the repository.

Every environment will have its own `json` file that contains the following format:
```
{
  "contracts": {
    "ContractName": {
      "abi": ABI map,
      "bytecode": "...",
      "address": "0x94d04e16e8e39b7f6a825689ce52aa60f68069cc"
    },
    ...
  }
}
```


