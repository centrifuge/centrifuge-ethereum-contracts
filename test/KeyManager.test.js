import {P2P_IDENTITY, P2P_SIGNATURE, ETH_MESSAGE_AUTH} from "./constants";
import {assertEvent, getEvents} from "./tools/contractEvents";

const createRandomByte = require('./tools/random').createRandomByte;
const mineNBlocks = require('./tools/blockHeight').mineNBlocks;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const Identity = artifacts.require("Identity");


async function getBasicTestNeeds() {
    let centrifugeId = createRandomByte(6);

    return {
        centrifugeId,
        identity: await Identity.new(centrifugeId),
        key: createRandomByte(32)
    };
}

contract("KeyMananger", function (accounts) {


    describe("Adding/Retrieving Keys", async function () {

        it("Should not add a empty key", async function () {
            const {identity} = await getBasicTestNeeds();
            await shouldRevert(identity.addMultiPurposeKey("", [P2P_IDENTITY]));
            await shouldRevert(identity.addKey("", P2P_IDENTITY));
        })

        it("Should not add a key with an empty purpose", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await shouldRevert(identity.addKey(key, ""));
            await shouldRevert(identity.addMultiPurposeKey(key, []));
        })

        it("should not allow adding a key if the sender is not the owner", async function () {
            const {identity, key} = await getBasicTestNeeds()
            await shouldRevert(identity.addMultiPurposeKey(key, [P2P_SIGNATURE], {from: accounts[1]}));
            await shouldRevert(identity.addKey(key, P2P_SIGNATURE, {from: accounts[1]}));
        })

        it("Should add a key with both P2P_IDENTITY and P2P_SIGNATURE purposes and retrieve it", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE]);
            const response = await identity.getKey(key);
            assert.equal(key, response[0]);
            assert.equal(P2P_IDENTITY, response[1][0].toNumber());
            assert.equal(P2P_SIGNATURE, response[1][1].toNumber());
            assert.equal(0, response[2]);
        })


        it('should add the same purpose only one time to a key', async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addKey(key, P2P_IDENTITY);
            await identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE]);
            await identity.addKey(key, P2P_SIGNATURE);
            const response = await identity.getKey(key);
            assert.equal(key, response[0]);
            assert.equal(P2P_IDENTITY, response[1][0].toNumber());
            assert.equal(P2P_SIGNATURE, response[1][1].toNumber());
            assert.equal(0, response[2].toNumber());
        })

        it("Should not find a key", async function () {
            const {identity, key} = await getBasicTestNeeds();
            const response = await identity.getKey(key);
            assert.equal("0x0000000000000000000000000000000000000000000000000000000000000000", response[0]);
            assert.equal(0, response[1].length);
            assert.equal(0, response[2].toNumber());
        })

        it("Should revert if trying to revoke an unexisting key", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await shouldRevert(identity.revokeKey(key));

        })

        it("Should revoke a key", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE]);
            await identity.revokeKey(key);
            const response = await identity.getKey(key);
            assert.equal(key, response[0]);
            assert.isAbove(response[2].toNumber(), 0);
        })

        it("Should add and retrieve keys by purpose", async function () {
            const {identity, key} = await getBasicTestNeeds();
            const key2 = createRandomByte(20);
            const key3 = createRandomByte(32);
            await identity.addKey(key, P2P_IDENTITY);
            await identity.addKey(key2, ETH_MESSAGE_AUTH);
            await identity.addMultiPurposeKey(key3, [P2P_IDENTITY, P2P_SIGNATURE]);

            const P2pIndentityKeys = await identity.getKeysByPurpose(P2P_IDENTITY);
            const P2pSignatureKeys = await identity.getKeysByPurpose(P2P_SIGNATURE);
            const EthMessageKeys = await identity.getKeysByPurpose(ETH_MESSAGE_AUTH);

            assert.equal(P2pIndentityKeys.length, 2);
            assert.equal(P2pSignatureKeys.length, 1);
            assert.equal(EthMessageKeys.length, 1);
            assert.equal(P2pIndentityKeys[0], key);
            assert.equal(P2pIndentityKeys[1], key3);
            assert.equal(P2pSignatureKeys[0], key3);
            assert.equal(EthMessageKeys[0].slice(0,42), key2);
        })
    });

    describe("Event dispatching", async function () {
        it("Should dispatch a KeyAdded event", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addKey(key, P2P_IDENTITY).then(tx => {
                const events = getEvents(tx, "KeyAdded");
                assert.equal(1, events.length);
                assert.equal(events[0].purpose.toNumber(), P2P_IDENTITY);
                assert.equal(events[0].key, key);
            });

        })

        it("Should dispatch a KeyRevoked event", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addKey(key, P2P_IDENTITY);
            await identity.revokeKey(key).then(tx => {
                const events = getEvents(tx, "KeyRevoked");
                assert.equal(1, events.length);
                assert.equal(events[0].key, key);
                assert.isAbove(events[0].revokedAt.toNumber(), 0);
            });

        })


        it("Should dispatch a KeyAdded event", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addKey(key, P2P_IDENTITY).then(tx => {
                const events = getEvents(tx, "KeyAdded");
                assert.equal(1, events.length);
                assert.equal(events[0].purpose.toNumber(), P2P_IDENTITY);
            });

        })

        it("Should dispatch 3 KeyAdded events in a specific order", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE]).then(tx => {
                const events = getEvents(tx, "KeyAdded");
                assert.equal(2, events.length);
                assert.equal(events[0].purpose.toNumber(), P2P_IDENTITY);
                assert.equal(events[1].purpose.toNumber(), P2P_SIGNATURE);
            });

        })

        it("Should dispatch 1 KeyAdded event because one purpose existed", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addKey(key, P2P_IDENTITY);
            await identity.addMultiPurposeKey(key, [P2P_IDENTITY, P2P_SIGNATURE]).then(tx => {
                const events = getEvents(tx, "KeyAdded");
                assert.equal(1, events.length);
                assert.equal(events[0].purpose.toNumber(), P2P_SIGNATURE);
            });
        })

    })

    describe("Check Gas", async function () {

        const maxAddMutipleGas = 250000;
        it(` Gas cost for adding a key with 3 purposes should be less then ${maxAddMutipleGas} `, async function () {
            const {identity, key} = await getBasicTestNeeds();
            const addMultiPurposeKeyGas = await identity.addMultiPurposeKey.estimateGas(key, [P2P_IDENTITY, P2P_SIGNATURE]);
            console.log('Actual addMultiPurposeKey gas cost:', addMultiPurposeKeyGas)
            assert.isBelow(addMultiPurposeKeyGas, maxAddMutipleGas, `Gas Price for addMultiPurposeKey is to high`)
        })

        const maxAddGas = 120000;
        it(` Gas cost for adding a key with one purpose should be less then ${maxAddGas} `, async function () {
            const {identity, key} = await getBasicTestNeeds();
            const addKeyGas = await identity.addKey.estimateGas(key, P2P_IDENTITY);
            console.log('Actual AddKey gas cost:', addKeyGas)
            assert.isBelow(addKeyGas, maxAddGas, `Gas Price for addKey is to high`)
        })

        const maxRevokeGas = 50000;
        it(` Gas cost for revoking a key should be less then ${maxRevokeGas} `, async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addMultiPurposeKey(key, [1]);
            const revokeKeyGas = await identity.revokeKey.estimateGas(key);
            console.log('Actual revokeKey gas cost:', revokeKeyGas)
            assert.isBelow(revokeKeyGas, maxRevokeGas, `Gas Price for revoke is to high`)
        })


    });

})

