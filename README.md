Running it
==========
* Install truffle globally: `npm install -g truffle`
* Run testrpc: `npm run testrpc-m`
* Run tests: `npm run re-test`


How to build go bindings
========================
To create a go binding for abi run the `abigen` script first:
```
$GOPATH/bin/abigen --abi build/contracts/Witness.abi  --pkg "witness" --type EthereumWitness --out WitnessContract.go
```

The abigen script unfortunately doesn't have the right go imports, therefore you need to add the following imports to the binding:

```
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"

```
