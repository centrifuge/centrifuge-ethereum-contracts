const getEventValue = require('./tools/contractEvents').getEventValue;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const {keccak} = require('ethereumjs-util');

let IdentityFactory = artifacts.require("IdentityFactory");
let Identity = artifacts.require("Identity");


let identityFactoryContract;

contract("IdentityFactory", function (accounts) {

    before(async function () {
        identityFactoryContract = await IdentityFactory.new();
    });

    describe("Create Identity", async function () {

        it("should register identity and transfer ownership to the sender", async function () {
            let createdAddress;
            await identityFactoryContract.createIdentity({from: accounts[1]}).then(function (tx) {
                createdAddress = getEventValue(tx, "IdentityCreated", "identity");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0")
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined")

            });

            const hasManagementKey = await Identity.at(createdAddress).then(i => i.keyHasPurpose(keccak(accounts[1]),1));
            assert.equal(hasManagementKey, true)
        });

        it("should register identity and transfer ownership to the provided address", async function () {
            let createdAddress;
            await identityFactoryContract.createIdentityFor(accounts[2], {from: accounts[1]}).then(function (tx) {
                createdAddress = getEventValue(tx, "IdentityCreated", "identity");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0")
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined")
            });

            const hasManagementKey = await Identity.at(createdAddress).then(i => i.keyHasPurpose(keccak(accounts[2]),1));
            assert.equal(hasManagementKey, true)
        });
    });

    describe("check the gas cost for identity creation", async function () {
        const maxGas = 1200000;
        it(`should have preCommit gas cost less then ${maxGas} `, async function () {
            const actualGas = await identityFactoryContract.createIdentity.estimateGas({from: accounts[1]});
            console.log('Actual identity creation gas cost:', actualGas)
            assert.isBelow(actualGas, maxGas, `Gas Price for identity creation is to high`)
        })

    });

});
