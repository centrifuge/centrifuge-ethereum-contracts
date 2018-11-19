#!/usr/bin/env bash

if [ -z ${CENT_ETHEREUM_CONTRACTS_DIR} ]; then
    local_dir="$(dirname "$0")"
else
    local_dir="${CENT_ETHEREUM_CONTRACTS_DIR}/scripts"
fi

usage() {
  echo "Usage: ${local_dir} env[localgeth|integration|rinkeby|local-ganache|kovan|ropsten]"
  exit 1
}

if [ "$#" -ne 1 ]
then
  usage
fi

ETH_ENV=${1}
if [[ ! "${ETH_ENV}" =~ ^(localgeth|integration|rinkeby|kovan|ropsten|local-ganache)$ ]]; then
    echo "Environment [${ETH_ENV}] not allowed"
    usage
fi

NETWORK_ID=8383
if [[ "$1" = "rinkeby" ]];
then
  NETWORK_ID=4
elif [[ "$1" = "ropsten" ]];
then
    NETWORK_ID=42
elif [[ "$1" = "kovan" ]];
then
    NETWORK_ID=3
elif [[ "$1" = "local-ganache" ]];
then
    NETWORK_ID=99999
fi

echo "Generating ethereum deployment file for env [${NETWORK_ID}] and env [${ETH_ENV}]"

ANCHOR_REGISTRY_ABI=`cat $local_dir/../build/contracts/AnchorRegistry.json | jq '.abi' | tr -d '\n'`
ANCHOR_REGISTRY_BYTECODE=`cat $local_dir/../build/contracts/AnchorRegistry.json | jq '.deployedBytecode' | tr -d '\n'`
ANCHOR_REGISTRY_ADDRESS=`cat $local_dir/../build/contracts/AnchorRegistry.json | jq --arg NETWORK_ID "${NETWORK_ID}" '.networks[$NETWORK_ID].address' | tr -d '\n'`

ANCHOR_REPOSITORY_ABI=`cat $local_dir/../build/contracts/AnchorRepository.json | jq '.abi' | tr -d '\n'`
ANCHOR_REPOSITORY_BYTECODE=`cat $local_dir/../build/contracts/AnchorRepository.json | jq '.deployedBytecode' | tr -d '\n'`
ANCHOR_REPOSITORY_ADDRESS=`cat $local_dir/../build/contracts/AnchorRepository.json | jq --arg NETWORK_ID "${NETWORK_ID}" '.networks[$NETWORK_ID].address' | tr -d '\n'`

PAYMENT_OBLIGATION_ABI=`cat $local_dir/../build/contracts/PaymentObligation.json | jq '.abi' | tr -d '\n'`
PAYMENT_OBLIGATION_BYTECODE=`cat $local_dir/../build/contracts/PaymentObligation.json | jq '.deployedBytecode' | tr -d '\n'`
PAYMENT_OBLIGATION_ADDRESS=`cat $local_dir/../build/contracts/PaymentObligation.json | jq --arg NETWORK_ID "${NETWORK_ID}" '.networks[$NETWORK_ID].address' | tr -d '\n'`

IDENTITY_REGISTRY_ABI=`cat $local_dir/../build/contracts/IdentityRegistry.json | jq '.abi' | tr -d '\n'`
IDENTITY_REGISTRY_BYTECODE=`cat $local_dir/../build/contracts/IdentityRegistry.json | jq '.deployedBytecode' | tr -d '\n'`
IDENTITY_REGISTRY_ADDRESS=`cat $local_dir/../build/contracts/IdentityRegistry.json | jq --arg NETWORK_ID "${NETWORK_ID}" '.networks[$NETWORK_ID].address' | tr -d '\n'`

IDENTITY_FACTORY_ABI=`cat $local_dir/../build/contracts/IdentityFactory.json | jq '.abi' | tr -d '\n'`
IDENTITY_FACTORY_BYTECODE=`cat $local_dir/../build/contracts/IdentityFactory.json | jq '.deployedBytecode' | tr -d '\n'`
IDENTITY_FACTORY_ADDRESS=`cat $local_dir/../build/contracts/IdentityFactory.json | jq --arg NETWORK_ID "${NETWORK_ID}" '.networks[$NETWORK_ID].address' | tr -d '\n'`

IDENTITY_ABI=`cat $local_dir/../build/contracts/Identity.json | jq '.abi' | tr -d '\n'`
IDENTITY_BYTECODE=`cat $local_dir/../build/contracts/Identity.json | jq '.deployedBytecode' | tr -d '\n'`


cat >$local_dir/../deployments/${ETH_ENV}.json <<EOF
{
  "contracts": {
    "AnchorRegistry": {
      "abi": ${ANCHOR_REGISTRY_ABI},
      "bytecode": ${ANCHOR_REGISTRY_BYTECODE},
      "address": ${ANCHOR_REGISTRY_ADDRESS}
    },
    "AnchorRepository": {
      "abi": ${ANCHOR_REPOSITORY_ABI},
      "bytecode": ${ANCHOR_REPOSITORY_BYTECODE},
      "address": ${ANCHOR_REPOSITORY_ADDRESS}
    },
    "PaymentObligation": {
      "abi": ${PAYMENT_OBLIGATION_ABI},
      "bytecode": ${PAYMENT_OBLIGATION_BYTECODE},
      "address": ${PAYMENT_OBLIGATION_ADDRESS}
    },
    "IdentityRegistry": {
      "abi": ${IDENTITY_REGISTRY_ABI},
      "bytecode": ${IDENTITY_REGISTRY_BYTECODE},
      "address": ${IDENTITY_REGISTRY_ADDRESS}
    },
    "IdentityFactory": {
      "abi": ${IDENTITY_FACTORY_ABI},
      "bytecode": ${IDENTITY_FACTORY_BYTECODE},
      "address": ${IDENTITY_FACTORY_ADDRESS}
    },
    "Identity": {
      "abi": ${IDENTITY_ABI},
      "bytecode": ${IDENTITY_BYTECODE},
      "address": ""
    }
  }
}
EOF
