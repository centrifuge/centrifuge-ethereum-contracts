#!/usr/bin/env bash

if [ -z ${CENT_ETHEREUM_CONTRACTS_DIR} ]; then
    local_dir="$(dirname "$0")"
else
    local_dir="${CENT_ETHEREUM_CONTRACTS_DIR}/scripts"
fi
rm -Rf $local_dir/../build
npm install @centrifuge/ethereum-contracts@latest --force --no-save
mkdir -p $local_dir/../build/contracts
cp -R -p $local_dir/../node_modules/@centrifuge/ethereum-contracts/build/contracts/Migrations.json $local_dir/../build/contracts/

