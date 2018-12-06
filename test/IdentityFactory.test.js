const assertEvent = require('./tools/contractEvents').assertEvent;
const getEventValue = require('./tools/contractEvents').getEventValue;

let IdentityFactory = artifacts.require("IdentityFactory");


let identityFactoryContract;

contract("IdentityFactory", function (accounts) {

    before(async function () {
        identityFactoryContract = await IdentityFactory.new();
    });

    describe("Create Identity", async function () {

        it("should register identity and transfer ownership to the sender", async function () {
            let createdAddress;
            await identityFactoryContract.createIdentity({from: accounts[1]}).then(function (tx) {
                assertEvent(tx, "OwnershipTransferred", {newOwner: accounts[1]});
                createdAddress = getEventValue(tx, "IdentityCreated", "centrifugeId");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0")
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined")
            });
        });

        it("should register identity and transfer ownership to the provided address", async function () {
            let createdAddress;
            await identityFactoryContract.createIdentityFor(accounts[2], {from: accounts[1]}).then(function (tx) {
                assertEvent(tx, "OwnershipTransferred", {newOwner: accounts[2]});
                createdAddress = getEventValue(tx, "IdentityCreated", "centrifugeId");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0")
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined")
            });
        });
    });

});
