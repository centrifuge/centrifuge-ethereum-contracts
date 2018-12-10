const ACTION = require('./constants').ACTION;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const {keccak} = require('ethereumjs-util');

const Identity = artifacts.require("Identity");
const TextProxyExecution = artifacts.require("TextProxyExecution");


contract("Identity", function (accounts) {

    describe("Identity Creation", async function () {
        it("should create identity", async function () {
            await Identity.new(accounts[1]);
        });
    });

    describe("Validate a signature", async function () {

        beforeEach(async function () {
            this.identity = await Identity.new(accounts[0]);
        });

        it("should validate a web3 signature", async function () {
            await this.identity.addKey(keccak(accounts[1]), ACTION, 1);
            const toSign = web3.utils.randomHex(32);
            const signature = await web3.eth.sign(toSign, accounts[1]);
            const isSignatureValid = await this.identity.isSignedWithPurpose(toSign, signature, ACTION);
            assert.equal(isSignatureValid, true, "signature should be valid");
        });

        it("should validate a signature generated with go-centrifuge", async function () {

            const address = "0xd77c534aed04d7ce34cd425073a033db4fbe6a9d";
            const signature = "0xccd09e65aab28553ad0d43b3980fcb66801d1da69085784307b57120c9790b4e68c55e0b6b740b20410fe4f360551e6b650de0bf1e0af5d09100fb0ae8e660c300";
            const msgInHex = "0x43656e74726966756765206c696b657320457468657265756d00000000000000"; //Centrifuge likes Ethereum

            await this.identity.addKey(keccak(address), ACTION, 1);
            const isSignatureValid = await this.identity.isSignedWithPurpose(msgInHex, signature, ACTION);
            assert.equal(isSignatureValid, true, "signature should be valid");
        });

        it("should be false because of an invalid signature", async function () {

            const address = "0xc41a4ba7f7b6df6e3229b7697d3dfc0efa744476";
            const falseSignature = "0x82fa5c4ef8921824653016e6f95b911c295b29400d193569d2714edabd55aa6877060421a7327d3818cb72c1f7cbc4ab6b3ca1c7dbe3b53fd9d34a38a37cc7611c";
            const msgInHex = "0x43656e74726966756765206c696b657320457468657265756d00000000000000"; //Centrifuge likes Ethereum

            await this.identity.addKey(keccak(address), ACTION, 1);
            const isSignatureValid = await this.identity.isSignedWithPurpose(msgInHex, falseSignature, ACTION);
            assert.equal(isSignatureValid, false, "signature should be invalid");
        })
    })

    describe("Proxy execution", async function () {
        beforeEach(async function () {
            this.identity = await Identity.new(accounts[0]);
            this.testProxy = await TextProxyExecution.new();
        });

        it('should execute contract method for identity MANAGEMENT key', async function () {
            const data = this.testProxy.contract.methods.callMe().encodeABI();
            shouldSucceed(await this.identity.execute(this.testProxy.address, 0, data));
            const numOfCalls = await this.testProxy.getCallsFrom(this.identity.address);
            assert.equal(1, numOfCalls.toNumber());
        })


        it('should execute contract method for identity ACTION key', async function () {
            const data = this.testProxy.contract.methods.callMe().encodeABI();
            await this.identity.addKey(keccak(accounts[1]), ACTION, 1);
            shouldSucceed(await this.identity.execute(this.testProxy.address, 0, data, {from: accounts[1]}));
            const numOfCalls = await this.testProxy.getCallsFrom(this.identity.address);
            assert.equal(1, numOfCalls.toNumber());
        })

        it('should revert execute for non MANAGEMENT or non ACTION keys ', async function () {
            const data = this.testProxy.contract.methods.callMe().encodeABI();
            await shouldRevert(this.identity.execute(this.testProxy.address, 0, data, {from: accounts[2]}));
        })

    })

});
