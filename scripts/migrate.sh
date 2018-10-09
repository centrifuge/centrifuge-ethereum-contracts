#!/usr/bin/env bash

if [ -z ${CENT_ETHEREUM_CONTRACTS_DIR} ]; then
    local_dir="$(dirname "$0")"
else
    local_dir="${CENT_ETHEREUM_CONTRACTS_DIR}/scripts"
fi

usage() {
  echo "Usage: ${local_dir} env[local|integration|rinkeby]"
  exit 1
}

if [ "$#" -ne 1 ]; then
  usage
fi

if [[ ! "$1" =~ ^(localgeth|integration|rinkeby)$ ]]; then
    echo "Environment [${1}] not allowed"
    usage
fi

NETWORK=$1
if [[ "$1" = "local" ]]; then
  NETWORK='localgeth'
fi

MIGRATE_ADDRESS=${MIGRATE_ADDRESS:-'0x89b0a86583c4444acfd71b463e0d3c55ae1412a5'}
MIGRATE_PASSWORD=${MIGRATE_PASSWORD:-''}

rm -Rf $local_dir/../build
if [[ "$1" =~ ^(localgeth|integration)$ ]]; then

  docker run -it --net=host --entrypoint "/geth" centrifugeio/cent-geth:v0.1.0 attach http://localhost:9545 --exec "personal.unlockAccount('${MIGRATE_ADDRESS}', '${MIGRATE_PASSWORD}', 500)"
fi

if [[ "$1" =~ ^(rinkeby)$ ]]; then
  npm install centrifuge-ethereum-contracts@latest --force --no-save
  cp -rf $local_dir/../node_modules/centrifuge-ethereum-contracts/build $local_dir/../build
fi


npm run  migrate -- --network "${NETWORK}"
if [ $? -ne 0 ]; then
  echo "aborting"
  exit 1
fi

