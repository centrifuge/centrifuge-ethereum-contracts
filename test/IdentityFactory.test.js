const getEventValue = require('./tools/contractEvents').getEventValue;

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
                createdAddress = getEventValue(tx, "IdentityCreated", "centrifugeId");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0")
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined")

            });

            let owner = await Identity.at(createdAddress).then(i => i.owner());
            assert.equal(owner, accounts[1])
        });

        it("should register identity and transfer ownership to the provided address", async function () {
            let createdAddress;
            await identityFactoryContract.createIdentityFor(accounts[2], {from: accounts[1]}).then(function (tx) {
                createdAddress = getEventValue(tx, "IdentityCreated", "centrifugeId");
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "0")
                assert.notEqual(web3.utils.hexToNumberString(createdAddress), "undefined")
            });

            let owner = await Identity.at(createdAddress).then(i => i.owner());
            assert.equal(owner, accounts[2])
        });
    });

});
