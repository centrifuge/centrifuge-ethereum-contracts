#!/bin/bash
set -e

TARGETDIR=${1:-centrifuge}

contracts=( "anchor.AnchorRegistry" "identity.Identity" "identity.IdentityRegistry" "identity.IdentityFactory" )

echo "Building ABI Json files"
truffle compile
mkdir -p abi

echo "Extracting ABI block into its own .abi file"
for i in "${contracts[@]}"
do
  echo "Building contracts for ${i}"
  package=`echo -n "${i}" | awk -F'.' '{print $1}'`
  contract=`echo -n "${i}" | awk -F'.' '{print $2}'`
  underscore=`echo "${contract}" | sed -e 's/\([A-Z]\)/_\1/g' | tr '[:upper:]' '[:lower:]'`
  mkdir -p ${TARGETDIR}/${package}
  cat build/contracts/${contract}.json | jq '.abi' > abi/${contract}.abi
  abigen --abi abi/${contract}.abi --pkg identity --type Ethereum${contract}Contract --out ${TARGETDIR}/${package}/ethereum${underscore}_contract.go
done
