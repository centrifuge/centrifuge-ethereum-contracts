const {ACTION, MANAGEMENT} = require('./constants');
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const addressToBytes32 = require('./tools/utils').addressToBytes32;

const Identity = artifacts.require("Identity");
const TextProxyExecution = artifacts.require("TextProxyExecution");


contract("Identity", function (accounts) {

    describe("Identity Creation", async function () {
        it("should create identity", async function () {
            await Identity.new(accounts[1], [], []);
        });

        it("should fail to deploy an identity", async function () {
            await shouldRevert(
                Identity.new(accounts[0], [accounts[1]], []),
                "Keys and purposes must have the same length"
            );

            await shouldRevert(
                Identity.new(accounts[0], [accounts[1]], [MANAGEMENT]),
                "Constructor can not add management keys"
            );
        })
    });

    describe("Proxy execution", async function () {
        beforeEach(async function () {
            this.identity = await Identity.new(accounts[0], [], []);
            this.testProxy = await TextProxyExecution.new();
        });

        it('should not execute contract method for identity MANAGEMENT key', async function () {
            const data = this.testProxy.contract.methods.callMe().encodeABI();
            await shouldRevert(
                this.identity.execute(this.testProxy.address, 0, data),
                "Requester must have an ACTION purpose"
            );
        })


        it('should execute contract method for identity ACTION key', async function () {
            const data = this.testProxy.contract.methods.callMe().encodeABI();
            await this.identity.addKey(addressToBytes32(accounts[1]), ACTION, 1);
            shouldSucceed(await this.identity.execute(this.testProxy.address, 0, data, {from: accounts[1]}));
            const numOfCalls = await this.testProxy.getCallsFrom(this.identity.address);
            assert.equal(1, numOfCalls.toNumber());
        })


        it('should revert execute for non ACTION keys ', async function () {
            const data = this.testProxy.contract.methods.callMe().encodeABI();
            await shouldRevert(
                this.identity.execute(this.testProxy.address, 0, data, {from: accounts[2]}),
                "Requester must have an ACTION purpose"
            );
        });

        it('should revert contract method for identity ACTION key', async function () {
            const data = this.testProxy.contract.methods.callMeRevert().encodeABI();
            await this.identity.addKey(addressToBytes32(accounts[1]), ACTION, 1);
            await shouldRevert(
                this.identity.execute(this.testProxy.address, 0, data, {from: accounts[1]}),
            );
        });

        it('should revert execute if contract does not exist ', async function () {
            const data = this.testProxy.contract.methods.callMe().encodeABI();
            await this.identity.addKey(addressToBytes32(accounts[1]), ACTION, 1);
            await shouldRevert(
                this.identity.execute(accounts[1], 0, data, {from: accounts[1]})
            );
        });
    })

});
