const {P2P_IDENTITY, P2P_SIGNATURE, ACTION} = require('./constants');
const shouldRevert = require('./tools/assertTx').shouldRevert;
const getEvents = require('./tools/contractEvents').getEvents;
const Identity = artifacts.require("Identity");


async function getBasicTestNeeds() {

    return {
        key: web3.utils.randomHex(32)
    };
}

contract("KeyManager", function (accounts) {

    beforeEach(async function () {
        this.identity = await Identity.new(accounts[0],[],[]);
    });

    describe("Adding/Retrieving Keys", async function () {

        it("Should not add a key with an empty purpose", async function () {
            const {key} = await getBasicTestNeeds();
            await shouldRevert(this.identity.addMultiPurposeKey(key, [], 1));
        })

        it("should not allow adding a key if the sender is not a MANAGEMENT KEY", async function () {
            const {key} = await getBasicTestNeeds()
            await shouldRevert(this.identity.addMultiPurposeKey(key, [P2P_SIGNATURE], 1, {from: accounts[1]}));
            await shouldRevert(this.identity.addKey(key, P2P_SIGNATURE, 1, {from: accounts[1]}));
        })

        it("Should add a key with both P2P_IDENTITY and P2P_SIGNATURE purposes and retrieve it", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE], 1);
            const response = await this.identity.getKey(key);
            assert.equal(key, response[0]);
            assert.equal(P2P_IDENTITY, response[1][0].toNumber());
            assert.equal(P2P_SIGNATURE, response[1][1].toNumber());
            assert.equal(0, response[2]);
        })


        it('should add the same purpose only one time to a key', async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addKey(key, P2P_IDENTITY, 1);
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE], 1);
            await this.identity.addKey(key, P2P_SIGNATURE, 1);
            const response = await this.identity.getKey(key);
            assert.equal(key, response[0]);
            assert.equal(P2P_IDENTITY, response[1][0].toNumber());
            assert.equal(P2P_SIGNATURE, response[1][1].toNumber());
            assert.equal(0, response[2].toNumber());
        })

        it("Should not find a key", async function () {
            const {key} = await getBasicTestNeeds();
            const response = await this.identity.getKey(key);
            assert.equal(key, response[0]);
            assert.equal(0, response[1].length);
            assert.equal(0, response[2].toNumber());
        })

        it("Should revert if trying to revoke an unexisting key", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await shouldRevert(this.identity.revokeKey(key));

        })

        it("Should revoke a key", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE], 1);
            await this.identity.revokeKey(key);
            const response = await this.identity.getKey(key);
            assert.equal(key, response[0]);
            assert.isAbove(response[2].toNumber(), 0);
        })

        it("Should add and retrieve keys by purpose", async function () {
            const {key} = await getBasicTestNeeds();
            const key2 = web3.utils.randomHex(32);
            const key3 = web3.utils.randomHex(32);
            await this.identity.addKey(key, P2P_IDENTITY, 1);
            await this.identity.addKey(key2, ACTION, 1);
            await this.identity.addMultiPurposeKey(key3, [P2P_IDENTITY, P2P_SIGNATURE],1);

            const P2pIndentityKeys = await this.identity.getKeysByPurpose(P2P_IDENTITY);
            const P2pSignatureKeys = await this.identity.getKeysByPurpose(P2P_SIGNATURE);
            const EthMessageKeys = await this.identity.getKeysByPurpose(ACTION);

            assert.equal(P2pIndentityKeys.length, 2);
            assert.equal(P2pSignatureKeys.length, 1);
            assert.equal(EthMessageKeys.length, 1);
            assert.equal(P2pIndentityKeys[0], key);
            assert.equal(P2pIndentityKeys[1], key3);
            assert.equal(P2pSignatureKeys[0], key3);
            assert.equal(EthMessageKeys[0], key2);
        })
    });

    describe("Event dispatching", async function () {
        it("Should dispatch a KeyAdded event", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addKey(key, P2P_IDENTITY, 1).then(tx => {
                const events = getEvents(tx, "KeyAdded");
                assert.equal(1, events.length);
                assert.equal(events[0].purpose.toNumber(), P2P_IDENTITY);
                assert.equal(events[0].key, key);
            });

        })

        it("Should dispatch a KeyRevoked event", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addKey(key, P2P_IDENTITY, 1);
            await this.identity.revokeKey(key).then(tx => {
                const events = getEvents(tx, "KeyRevoked");
                assert.equal(1, events.length);
                assert.equal(events[0].key, key);
                assert.isAbove(events[0].revokedAt.toNumber(), 0);
            });

        })


        it("Should dispatch a KeyAdded event", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addKey(key, P2P_IDENTITY, 1).then(tx => {
                const events = getEvents(tx, "KeyAdded");
                assert.equal(1, events.length);
                assert.equal(events[0].purpose.toNumber(), P2P_IDENTITY);
            });

        })

        it("Should dispatch 3 KeyAdded events in a specific order", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE], 1).then(tx => {
                const events = getEvents(tx, "KeyAdded");
                assert.equal(2, events.length);
                assert.equal(events[0].purpose.toNumber(), P2P_IDENTITY);
                assert.equal(events[1].purpose.toNumber(), P2P_SIGNATURE);
            });

        })

        it("Should dispatch 1 KeyAdded event because one purpose existed", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addKey(key, P2P_IDENTITY, 1);
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE], 1).then(tx => {
                const events = getEvents(tx, "KeyAdded");
                assert.equal(1, events.length);
                assert.equal(events[0].purpose.toNumber(), P2P_SIGNATURE);
            });
        })

    })

})
