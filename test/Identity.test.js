const ETH_MESSAGE_AUTH = require('./constants').ETH_MESSAGE_AUTH;
const shouldRevert = require('./tools/assertTx').shouldRevert;

let Identity = artifacts.require("Identity");
let identityRecord;

contract("Identity", function (accounts) {

    describe("Identity Creation", async function () {

        it("should create identity", async function () {
            let centrifugeId = web3.utils.randomHex(6);

            let instance = await Identity.new(centrifugeId);
            let readCentrifugeId = web3.utils.toHex(await instance.centrifugeId.call());

            assert.equal(accounts[0], await instance.owner.call(), "The owner of the contract should be the owner address.");
            assert.equal(readCentrifugeId, centrifugeId, "The centrifugeId stored should be the same as passed.");
        });

        it("should not create identity if centrifugeId is 0x0", async function () {
            let centrifugeId = "0x0";
            await shouldRevert(Identity.new(centrifugeId));
        });

    });

    describe("Should Validate a signature", async function () {
        before(async function () {
            identityRecord = await Identity.new(web3.utils.randomHex(6));
        });
        it("should validate a web3 signature", async function(){
            await identityRecord.addKey(accounts[1], ETH_MESSAGE_AUTH);
            const toSign = web3.utils.randomHex(32);
            const signature = await web3.eth.sign( toSign, accounts[1],);
            const isSignatureValid = await identityRecord.isSignatureValid(toSign, signature);
            assert.equal(isSignatureValid, true, "signature should be valid");
        });
        it("should validate a signature generated with go-centrifuge", async function(){

            const address = "0xd77c534aed04d7ce34cd425073a033db4fbe6a9d";
            const signature = "0xccd09e65aab28553ad0d43b3980fcb66801d1da69085784307b57120c9790b4e68c55e0b6b740b20410fe4f360551e6b650de0bf1e0af5d09100fb0ae8e660c300";
            const msgInHex = "0x43656e74726966756765206c696b657320457468657265756d00000000000000"; //Centrifuge likes Ethereum

            await identityRecord.addKey(address, ETH_MESSAGE_AUTH);
            const isSignatureValid = await identityRecord.isSignatureValid(msgInHex, signature);
            assert.equal(isSignatureValid, true, "signature should be valid");
        });
        it("should be false because of an invalid signature", async function(){

            const address = "0xc41a4ba7f7b6df6e3229b7697d3dfc0efa744476";
            const falseSignature = "0x82fa5c4ef8921824653016e6f95b911c295b29400d193569d2714edabd55aa6877060421a7327d3818cb72c1f7cbc4ab6b3ca1c7dbe3b53fd9d34a38a37cc7611c";
            const msgInHex = "0x43656e74726966756765206c696b657320457468657265756d00000000000000"; //Centrifuge likes Ethereum

            await identityRecord.addKey(address, ETH_MESSAGE_AUTH);
            const isSignatureValid = await identityRecord.isSignatureValid(msgInHex, falseSignature);
            assert.equal(isSignatureValid, false, "signature should be invalid");
        })


    })

});
