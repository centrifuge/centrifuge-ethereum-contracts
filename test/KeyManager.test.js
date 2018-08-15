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
            await shouldRevert(identity.addKey("", [1]));
        })

        it("Should not add a key with an empty purpose", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await shouldRevert(identity.addKey(key, []));
        })

        it("should not allow adding a key if the sender is not the owner or a management key", async function () {
            const {identity, key} = await getBasicTestNeeds()
            await shouldRevert(identity.addKey(key, [], {from: accounts[1]}));
        })

        it("should allow adding a key if the sender is a MANAGEMENT KEY", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addKey(accounts[1], [1]);
            await shouldSucceed(identity.addKey(key, [2], {from: accounts[1]}));
        })

        it("Should add a key with all purposes and retrieve it", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addKey(key, [1, 2, 3]);
            const response = await identity.getKey(key);
            assert.equal(key, response[0]);
            response[1].forEach((item, index) => {
                assert.equal(index + 1, item.toNumber());
            })
            assert.equal(0, response[2].toNumber());
        })

        it("Should revoke a key", async function () {
            const {identity, key} = await getBasicTestNeeds();
            await identity.addKey(key, [1]);
            await identity.revokeKey(key);
            const response = await identity.getKey(key);
            assert.equal(key, response[0]);
            assert.isAbove(response[2].toNumber(), 0);
        })

        it("Should retrieve keys by purpose", async function () {
            const {identity, key} = await getBasicTestNeeds();
            const key2 = createRandomByte(32);
            const key3 = createRandomByte(32);
            await identity.addKey(key, [1]);
            await identity.addKey(key2, [2]);
            await identity.addKey(key3, [1]);
            const manangementKeys = await identity.getKeysByPurpose(1);
            const p2pKeys = await identity.getKeysByPurpose(2);

            assert.equal(manangementKeys.length, 2);
            assert.equal(p2pKeys.length, 1);
            assert.equal(manangementKeys[0], key);
            assert.equal(manangementKeys[1], key3);
            assert.equal(p2pKeys[0], key2);
        })

        describe("Check Gas", async function () {

            const maxAddGas = 120000;
            it(` Gas cost for adding a key with one purpose should be less then ${maxAddGas} `, async function () {
                const {identity, key} = await getBasicTestNeeds();
                const addKeyGas = await identity.addKey.estimateGas(key, [1]);
                console.log('Actual addKey gas cost:', addKeyGas)
                assert.isBelow(addKeyGas, maxAddGas, `Gas Price for addKey is to high`)
            })

            const maxRevokeGas = 50000;
            it(` Gas cost for revoking a key should be less then ${maxRevokeGas} `, async function () {
                const {identity, key} = await getBasicTestNeeds();
                await identity.addKey(key, [1]);
                const revokeKeyGas = await identity.revokeKey.estimateGas(key);
                console.log('Actual revokeKey gas cost:', revokeKeyGas)
                assert.isBelow(revokeKeyGas, maxRevokeGas, `Gas Price for revoke is to high`)
            })



        });
    });

})

