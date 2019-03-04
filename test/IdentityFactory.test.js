const  {ACTION,P2P_SIGNATURE,MANAGEMENT} = require('./constants');

const getEventValue = require('./tools/contractEvents').getEventValue;
const addressToBytes32 = require('./tools/utils').addressToBytes32;

let IdentityFactory = artifacts.require("IdentityFactory");
let Identity = artifacts.require("Identity");


contract("IdentityFactory", function (accounts) {

    before(async function () {
        this.identityFactory = await IdentityFactory.new();
    });

    describe("Create Identity", async function () {

        it("should create and register an identity for the sender", async function () {
            let createdAddress;
            await this.identityFactory.createIdentity({from: accounts[1]}).then(function (tx) {
                createdAddress = getEventValue(tx, "IdentityCreated", "identity");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined");

            });

            const hasManagementKey = await Identity.at(createdAddress).then(i => i.keyHasPurpose(addressToBytes32(accounts[1]), MANAGEMENT));
            assert.equal(hasManagementKey, true);

            const identityAddressStored = await this.identityFactory.createdIdentity(createdAddress);
            assert.equal(identityAddressStored,true);
        });

        it("should create and register an identity with the provided address as MANAGEMENT and the sender as ACTION", async function () {
            let createdAddress;
            await this.identityFactory.createIdentityFor(accounts[2],[addressToBytes32(accounts[1])],[ACTION], {from: accounts[1]}).then(function (tx) {
                createdAddress = getEventValue(tx, "IdentityCreated", "identity");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined");
            });

            const hasManagementKey = await Identity.at(createdAddress).then(i => i.keyHasPurpose(addressToBytes32(accounts[2]), MANAGEMENT));
            const hasActionKey = await Identity.at(createdAddress).then(i => i.keyHasPurpose(addressToBytes32(accounts[1]), ACTION));

            assert.equal(hasManagementKey, true);
            assert.equal(hasActionKey, true);
            const identityAddressStored = await this.identityFactory.createdIdentity(createdAddress);
            assert.equal(identityAddressStored,true);
        });

        it("should not find a registered identity", async function () {
            const identityAddressStored = await this.identityFactory.createdIdentity(accounts[1]);
            assert.equal(identityAddressStored,false);
        });


        it("should create and register an identity with default values", async function () {
            let createdAddress;
            await this.identityFactory.createIdentityFor(accounts[2],[addressToBytes32(accounts[1]),addressToBytes32(accounts[1])],[ACTION,P2P_SIGNATURE], {from: accounts[1]}).then(function (tx) {
                createdAddress = getEventValue(tx, "IdentityCreated", "identity");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined");
            });

            const hasManagementKey = await Identity.at(createdAddress).then(i => i.keyHasPurpose(addressToBytes32(accounts[2]),MANAGEMENT));
            const hasActionKey = await Identity.at(createdAddress).then(i => i.keyHasPurpose(addressToBytes32(accounts[1]),ACTION));
            const hasP2PKey = await Identity.at(createdAddress).then(i => i.keyHasPurpose(addressToBytes32(accounts[1]),P2P_SIGNATURE));

            assert.equal(hasManagementKey, true);
            assert.equal(hasActionKey, true);
            assert.equal(hasP2PKey, true);
            const identityAddressStored = await this.identityFactory.createdIdentity(createdAddress);
            assert.equal(identityAddressStored,true);
        });

        it("should not find a registered identity", async function () {
            const identityAddressStored = await this.identityFactory.createdIdentity(accounts[1]);
            assert.equal(identityAddressStored,false);
        });
    });



});
