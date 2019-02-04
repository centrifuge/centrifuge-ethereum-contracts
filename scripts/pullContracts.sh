#!/usr/bin/env bash

if [ -z ${CENT_ETHEREUM_CONTRACTS_DIR} ]; then
    local_dir="$(dirname "$0")"
else
    local_dir="${CENT_ETHEREUM_CONTRACTS_DIR}/scripts"
fi
rm -Rf $local_dir/../build
npm install @centrifuge/ethereum-contracts@latest --force --no-save
cp -rf $local_dir/../node_modules/@centrifuge/ethereum-contracts/build $local_dir/../build


