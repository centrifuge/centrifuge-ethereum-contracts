const {P2P_IDENTITY, P2P_SIGNATURE, ACTION, MANAGEMENT} = require('./constants');
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const getEvents = require('./tools/contractEvents').getEvents;
const addressToBytes32 = require('./tools/utils').addressToBytes32;
const Identity = artifacts.require("Identity");


async function getBasicTestNeeds() {

    return {
        key: web3.utils.randomHex(32)
    };
}

contract("KeyManager", function (accounts) {

    beforeEach(async function () {
        this.identity = await Identity.new(accounts[0], [], []);
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

        it("should not allow adding a key if the MANAGEMENT is a revoked ", async function () {
            const {key} = await getBasicTestNeeds()
            await shouldSucceed(this.identity.addKey(addressToBytes32(accounts[1]), MANAGEMENT, 1));
            await shouldSucceed(this.identity.addKey(key, P2P_SIGNATURE, 1, {from: accounts[1]}));

            await this.identity.revokeKey(addressToBytes32(accounts[1]));
            await shouldRevert(
                this.identity.addKey(key, P2P_IDENTITY, 1, {from: accounts[1]}),
                "No management right"
            );
        })

        it("Should add a key with both P2P_IDENTITY and P2P_SIGNATURE purposes and retrieve it", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE], 1);
            const response = await this.identity.getKey(key);
            assert.equal(key, response[0]);
            assert.equal(P2P_IDENTITY, web3.utils.toHex(response[1][0]));
            assert.equal(P2P_SIGNATURE, web3.utils.toHex(response[1][1]));
            assert.equal(0, response[2]);
        });

        it("Should revert when if key already has given purpose", async function () {
            const {key} = await getBasicTestNeeds();
            await shouldRevert(
                this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_IDENTITY], 1),
                "Key already has the given purpose"
            );
        })

        it("Should not find a key", async function () {
            const {key} = await getBasicTestNeeds();
            const response = await this.identity.getKey(key);
            assert.equal(key, response[0]);
            assert.equal(0, response[1].length);
            assert.equal(0, response[2].toNumber());
        })

        it("Should revert when trying to revoke an unexisting key", async function () {
            const {key} = await getBasicTestNeeds();
            await shouldRevert(
                this.identity.revokeKey(key),
                "Key does not exist"
            );
        })


        it("Should revert when trying to revoke a revoked key", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE], 1);
            await this.identity.revokeKey(key);
            await shouldRevert(
                this.identity.revokeKey(key),
                "Key is revoked"
            );
        })


        it("Should revoke a key", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE], 1);
            await this.identity.revokeKey(key);
            const response = await this.identity.getKey(key);
            assert.equal(key, response[0]);
            assert.isAbove(response[2].toNumber(), 0);
        })


        it("Should  fail when trying to revoke a own management key", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE], 1);

            await shouldRevert(
                this.identity.revokeKey(addressToBytes32(accounts[0])),
                "Can not perform action on own key"
            );

        })

        it("Should  fail when trying to add identity address as a MANAGEMENT KEY", async function () {
            await shouldRevert(
                this.identity.addMultiPurposeKey(addressToBytes32(this.identity.address), [MANAGEMENT], 1),
                "Own address can not be a management key",
            );

        })

        it("Should add and retrieve keys by purpose", async function () {
            const {key} = await getBasicTestNeeds();
            const key2 = web3.utils.randomHex(32);
            const key3 = web3.utils.randomHex(32);
            await this.identity.addKey(key, P2P_IDENTITY, 1);
            await this.identity.addKey(key2, ACTION, 1);
            await this.identity.addMultiPurposeKey(key3, [P2P_IDENTITY, P2P_SIGNATURE], 1);

            const P2pIndentityKeys = await this.identity.getKeysByPurpose(P2P_IDENTITY);
            const P2pSignatureKeys = await this.identity.getKeysByPurpose(P2P_SIGNATURE);
            const EthMessageKeys = await this.identity.getKeysByPurpose(ACTION);
            const NoPurposeKeys = await this.identity.getKeysByPurpose(999929292);

            assert.equal(NoPurposeKeys[0].length, 0);
            assert.equal(NoPurposeKeys[1].length, 0);
            assert.equal(NoPurposeKeys[2].length, 0);
            assert.equal(P2pIndentityKeys[0].length, 2);
            assert.equal(P2pIndentityKeys[1].length, 2);
            assert.equal(P2pIndentityKeys[2].length, 2);
            assert.equal(P2pSignatureKeys[0].length, 1);
            assert.equal(P2pSignatureKeys[1].length, 1);
            assert.equal(P2pSignatureKeys[2].length, 1);
            assert.equal(EthMessageKeys[0].length, 1);
            assert.equal(EthMessageKeys[1].length, 1);
            assert.equal(EthMessageKeys[2].length, 1);
            assert.equal(P2pIndentityKeys[0][0], key);
            assert.equal(P2pIndentityKeys[0][1], key3);
            assert.equal(P2pSignatureKeys[0][0], key3);
            assert.equal(EthMessageKeys[0][0], key2);
        })
    });

    describe("Event dispatching", async function () {
        it("Should dispatch a KeyAdded event", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addKey(key, P2P_IDENTITY, 1).then(tx => {
                const events = getEvents(tx, "KeyAdded");
                assert.equal(1, events.length);
                assert.equal(web3.utils.toHex(events[0].purpose), P2P_IDENTITY);
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
                assert.equal(web3.utils.toHex(events[0].purpose), P2P_IDENTITY);
            });

        })

        it("Should dispatch 3 KeyAdded events in a specific order", async function () {
            const {key} = await getBasicTestNeeds();
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE], 1).then(tx => {
                const events = getEvents(tx, "KeyAdded");
                assert.equal(2, events.length);
                assert.equal(web3.utils.toHex(events[0].purpose), P2P_IDENTITY);
                assert.equal(web3.utils.toHex(events[1].purpose), P2P_SIGNATURE);
            });

        })

    })

})
