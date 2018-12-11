const getEventValue = require('./tools/contractEvents').getEventValue;
const addressToBytes32 = require('./tools/utils').addressToBytes32;

let IdentityFactory = artifacts.require("IdentityFactory");
let Identity = artifacts.require("Identity");


contract("IdentityFactory", function (accounts) {

    before(async function () {
        this.identityFactory = await IdentityFactory.new();
    });

    describe("Create Identity", async function () {

        it("should register identity for  the sender", async function () {
            let createdAddress;
            await this.identityFactory.createIdentity({from: accounts[1]}).then(function (tx) {
                createdAddress = getEventValue(tx, "IdentityCreated", "identity");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0")
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined")

            });

            const hasManagementKey = await Identity.at(createdAddress).then(i => i.keyHasPurpose(addressToBytes32(accounts[1]),1));
            assert.equal(hasManagementKey, true)
        });

        it("should register identity the provided address", async function () {
            let createdAddress;
            await this.identityFactory.createIdentityFor(accounts[2], {from: accounts[1]}).then(function (tx) {
                createdAddress = getEventValue(tx, "IdentityCreated", "identity");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0")
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined")
            });

            const hasManagementKey = await Identity.at(createdAddress).then(i => i.keyHasPurpose(addressToBytes32(accounts[2]),1));
            assert.equal(hasManagementKey, true)
        });
    });



});
