CI Status
==========
[![Build Status](https://travis-ci.com/CentrifugeInc/centrifuge-ethereum-contracts.svg?token=bsfbw2zXLuaTvhVTDXMh&branch=master)](https://travis-ci.com/CentrifugeInc/centrifuge-ethereum-contracts)


Running it
==========
```bash
# install truffle globally on the machine
npm install -g truffle

# install nodemon globally on the machine
npm install -g nodemon

# install the repo dependencies
npm install 

# run testrpc with fixed mnmonic
npm run testrpc-m

# to run tests
npm run test

# to continuously run tests, if you so choose
npm run re-test
```


How to build go bindings
========================
To create a go binding for abi run the `abigen` script first:
```
$GOPATH/bin/abigen --abi abi/Witness.abi  --pkg "witness" --type EthereumWitness --out centrifuge/witness/witnessContract.go
```

The abigen script unfortunately doesn't have the right go imports, therefore you need to add the following imports to the binding:

```
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"

```
