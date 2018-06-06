CI Status
---------
[![Build Status](https://travis-ci.com/CentrifugeInc/centrifuge-ethereum-contracts.svg?token=bsfbw2zXLuaTvhVTDXMh&branch=master)](https://travis-ci.com/CentrifugeInc/centrifuge-ethereum-contracts)


Running it
----------
```bash
# install truffle globally on the machine
npm install -g truffle

# install nodemon globally on the machine
npm install -g nodemon

# install ganache-cli globally on the machine
npm install -g ganache-cli@6.1.0

# install the repo dependencies
npm install 

# run testrpc with fixed mnmonic
npm run testrpc-m

# to run tests
npm run test

# to continuously run tests, if you so choose
npm run re-test
```

Migrate Smart Contracts against Integration Environment
-------------------------------------------------------

Follow instructions under https://github.com/CentrifugeInc/go-centrifuge/blob/master/README.md to deploy a local light node that bootstraps from the remote node.
As soon as the local proxy node is running, and synced:
* Copy `migrateAccount.json` file to your $ETH_DATADIR/$NETWORK_ID/keystore
* Unlock migrate account `personal.unlockAccount("0x45b9c4798999ffa52e1ff1efce9d3e45819e4158", "INPUT_PWD", 500)`
* Perform Truffle migrate `truffle migrate -f 2 --network "integration"`
* Update Addresses and ABIs under `./deployments/integration.json`


Migrate Smart Contracts against Rinkeby Environment
---------------------------------------------------

Follow instructions under https://github.com/CentrifugeInc/go-centrifuge/blob/master/README.md to deploy a local light Rinkeby node.
As soon as the local proxy node is running:
* Unlock migrate account `personal.unlockAccount("0x44a0579754d6c94e7bb2c26bfa7394311cc50ccb", "INPUT_PWD", 500)`
* Perform Truffle migrate `truffle migrate -f 2 --network "rinkeby"`
* Update Addresses and ABIs under `./deployments/rinkeby.json`


Released ABIs + Addresses
-------------------------

We keep track of the released ABIs and their respective deployed addresses as part of the repository.

Every environment will have its own `json` file that contains the following format:
```
{
  "contracts": {
    "ContractName": {
      "abi": ABI map,
      "address": "0x94d04e16e8e39b7f6a825689ce52aa60f68069cc"
    },
    ...
  }
}
```

We will take advantage of git revision/version control of our smart contracts deployed. 
Master branch always refer to latest, while tags/branches will refer to specific releases.

