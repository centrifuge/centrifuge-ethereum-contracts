#!/usr/bin/env bash

local_dir="$(dirname "$0")"

usage() {
  echo "Usage: $0 env[integration|rinkeby]"
  exit 1
}

if [ "$#" -ne 1 ]
then
  usage
fi

if [[ ! "$1" =~ ^(integration|rinkeby)$ ]]; then
    echo "Environment [${1}] not allowed"
    usage
fi

NETWORK_ID=8383
if [[ "$1" = "rinkeby" ]];
then
  NETWORK_ID=4
fi

ANCHOR_REGISTRY_ABI=`cat $local_dir/../build/contracts/AnchorRegistry.json | jq '.abi' | tr -d '\n'`
ANCHOR_REGISTRY_BYTECODE=`cat $local_dir/../build/contracts/AnchorRegistry.json | jq '.bytecode' | tr -d '\n'`
ANCHOR_REGISTRY_ADDRESS=`cat $local_dir/../build/contracts/AnchorRegistry.json | jq --arg NETWORK_ID "${NETWORK_ID}" '.networks[$NETWORK_ID].address' | tr -d '\n'`

IDENTITY_REGISTRY_ABI=`cat $local_dir/../build/contracts/IdentityRegistry.json | jq '.abi' | tr -d '\n'`
IDENTITY_REGISTRY_BYTECODE=`cat $local_dir/../build/contracts/IdentityRegistry.json | jq '.bytecode' | tr -d '\n'`
IDENTITY_REGISTRY_ADDRESS=`cat $local_dir/../build/contracts/IdentityRegistry.json | jq --arg NETWORK_ID "${NETWORK_ID}" '.networks[$NETWORK_ID].address' | tr -d '\n'`

IDENTITY_FACTORY_ABI=`cat $local_dir/../build/contracts/IdentityFactory.json | jq '.abi' | tr -d '\n'`
IDENTITY_FACTORY_BYTECODE=`cat $local_dir/../build/contracts/IdentityFactory.json | jq '.bytecode' | tr -d '\n'`
IDENTITY_FACTORY_ADDRESS=`cat $local_dir/../build/contracts/IdentityFactory.json | jq --arg NETWORK_ID "${NETWORK_ID}" '.networks[$NETWORK_ID].address' | tr -d '\n'`

IDENTITY_ABI=`cat $local_dir/../build/contracts/Identity.json | jq '.abi' | tr -d '\n'`
IDENTITY_BYTECODE=`cat $local_dir/../build/contracts/Identity.json | jq '.bytecode' | tr -d '\n'`

cat >$local_dir/../deployments/${1}.json <<EOF
{
  "contracts": {
    "AnchorRegistry": {
      "abi": ${ANCHOR_REGISTRY_ABI},
      "bytecode": ${ANCHOR_REGISTRY_BYTECODE},
      "address": ${ANCHOR_REGISTRY_ADDRESS}
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