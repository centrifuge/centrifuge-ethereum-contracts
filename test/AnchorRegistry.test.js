var AnchorRegistry = artifacts.require("AnchorRegistry");

const ANCHOR_SCHEMA_VERSION = 1;

function createRandomByte32() {
    let identifier = '';
    for (var i = 0; i < 64; i++) {
        identifier += Math.floor(Math.random() * 16).toString(16)
    }
    return '0x' + identifier
}

let deployedAnchorRegistry;

async function getBasicTestNeeds(accounts) {

    return {
        identifier: createRandomByte32(),
        nextidentifier: createRandomByte32(),
        merkleRoot: createRandomByte32(),
        anchorRegistry: deployedAnchorRegistry,
        callOptions: { from: accounts[0] }
    }
}

contract("AnchorRegistry", function (accounts) {
    before(async function () {
        deployedAnchorRegistry = await AnchorRegistry.deployed();
    });

    describe("Anchor Creation", async function () {
        it("should only allow fully filled anchors to be recorded", async function () {
            const { identifier, nextidentifier, merkleRoot, anchorRegistry, callOptions } = await getBasicTestNeeds(accounts);
 
            await anchorRegistry.registerAnchor("", merkleRoot, ANCHOR_SCHEMA_VERSION, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to register incomplete anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRegistry.registerAnchor(identifier, "", ANCHOR_SCHEMA_VERSION, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to register incomplete anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })            

            await anchorRegistry.registerAnchor(null, merkleRoot, ANCHOR_SCHEMA_VERSION, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to register incomplete anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRegistry.registerAnchor(identifier, null, ANCHOR_SCHEMA_VERSION, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to register incomplete anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })                        

            await anchorRegistry.registerAnchor(identifier, merkleRoot, 0, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to register incomplete anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })            
        })


        it("should write a merkle root to the chain and be able to read it", async function () {
            const { identifier, nextidentifier, merkleRoot, anchorRegistry, callOptions } = await getBasicTestNeeds(accounts);

            await anchorRegistry.registerAnchor(identifier, merkleRoot, ANCHOR_SCHEMA_VERSION, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {
                assert.fail(0, 0, e.message)
            })

            let response = await anchorRegistry.getAnchorById.call(identifier, callOptions)
            assert.equal(identifier, response[0])
            assert.equal(merkleRoot, response[1])
            //TODO test on timestamp validity for now testing only for value to be set
            // assert.equal(timestampOfTransaction, response[2])
            assert.notEqual(0, response[2])
            assert.equal(ANCHOR_SCHEMA_VERSION, response[3])
        })

 
        it("should not be able to overwrite existing anchor", async function () {
            const { identifier, nextidentifier, merkleRoot, anchorRegistry, callOptions } = await getBasicTestNeeds(accounts);
            const otherMerkleRoot = createRandomByte32();

            await anchorRegistry.registerAnchor(identifier, merkleRoot, ANCHOR_SCHEMA_VERSION, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {
                assert.fail(0, 0, e.message)
            })

            // Try overwriting an existing anchor
            await anchorRegistry.registerAnchor(identifier, merkleRoot, ANCHOR_SCHEMA_VERSION, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to overwrite existing anchor ID")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            // Ensure merkleRoot hasn't changed
            response = await anchorRegistry.getAnchorById.call(identifier, callOptions)
            assert.equal(merkleRoot, response[1])
        })


        it("should return an empty anchor for wrong identifier", async function () {
            const { identifier, nextidentifier, merkleRoot, anchorRegistry, callOptions } = await getBasicTestNeeds(accounts);
            const notExistingAnchorId = createRandomByte32();

            let response = await anchorRegistry.getAnchorById.call(notExistingAnchorId, callOptions)
            assert.equal("0x0000000000000000000000000000000000000000000000000000000000000000", response[0])
            assert.equal("0x0000000000000000000000000000000000000000000000000000000000000000", response[1])
            assert.equal("0x0000000000000000000000000000000000000000000000000000000000000000", response[2])
            assert.equal(0, response[3])
        })


    })
})
