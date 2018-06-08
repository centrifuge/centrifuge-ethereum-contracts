#!/usr/bin/env bash

local_dir="$(dirname "$0")"

usage() {
  echo "Usage: $0 env[local|integration|rinkeby]"
  exit 1
}

if [ "$#" -ne 1 ]; then
  usage
fi

if [[ ! "$1" =~ ^(local|integration|rinkeby)$ ]]; then
    echo "Environment [${1}] not allowed"
    usage
fi

NETWORK=$1
if [[ "$1" = "local" ]]; then
  NETWORK='localgeth'
fi

if [[ "$1" =~ ^(local|integration)$ ]]; then
  docker run -it --net=host --entrypoint "/geth" centrifugeio/cent-geth:latest attach http://localhost:9545 --exec "personal.unlockAccount('0x45b9c4798999ffa52e1ff1efce9d3e45819e4158', 'Ee9NECgnUymYygyJpbNWdf+d', 500)"
fi

rm -Rf $local_dir/../build

truffle migrate -f 2 --network "${NETWORK}"
if [ $? -ne 0 ]; then
  echo "aborting"
  exit 1
fi

if [[ "$1" != "local" ]]; then
  $local_dir/generateEnvFile.sh ${1}
fi
