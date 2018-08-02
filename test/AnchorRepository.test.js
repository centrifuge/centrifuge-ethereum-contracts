const createRandomByte = require('./tools/random').createRandomByte;
const mineNBlocks = require('./tools/blockHeight').mineNBlocks;

var AnchorRepository = artifacts.require("AnchorRepository");

let deployedAnchorRepository;

async function getBasicTestNeeds(accounts) {

    return {
        anchorId: createRandomByte(32),
        nextAnchorId: createRandomByte(8),
        signingRoot: createRandomByte(32),
        documentRoot: createRandomByte(32),
        centrifugeId: createRandomByte(8),
        anchorRepository:deployedAnchorRepository,
        callOptions: { from: accounts[0] }
    }
}

contract("AnchorRepository", function (accounts) {
    before(async function () {
        deployedAnchorRepository = await AnchorRepository.deployed();
    });

    describe("Committing an anchor", async function () {

        it("should only allow fully filled PreAnchors to be recorded", async function () {
            const { anchorId, signingRoot, documentRoot, anchorRepository, callOptions } = await getBasicTestNeeds(accounts);
 
            await anchorRepository.preCommit("", signingRoot, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to preCommit an incomplete PreAnchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.preCommit(null, signingRoot, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to preCommit and incomplete PreAnchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.preCommit(anchorId, "", callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to preCommit an incomplete PreAnchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.preCommit(anchorId, null, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to preCommit an incomplete PreAnchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

        })


        it("should only allow fully filled Anchors to be recorded", async function () {
            const { anchorId, documentRoot, centrifugeId, anchorRepository, callOptions } = await getBasicTestNeeds(accounts);

            await anchorRepository.commit("", documentRoot, centrifugeId, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(null, documentRoot, centrifugeId, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(anchorId, "", centrifugeId, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(anchorId, null, centrifugeId, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(anchorId, documentRoot, "", callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(anchorId, documentRoot, null, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

        })


        it("should not allow a preCommit if for an anchorId  already has a valid one", async function() {

            const { anchorId, signingRoot,  documentRoot, centrifugeId, anchorRepository, callOptions } = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {
                assert.fail(0, 0, e.message)
            })

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.fail(0, 0)
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })
        })

       it("should not allow a commit without an existing precommit", async function() {
           const { anchorId, documentRoot, centrifugeId, anchorRepository, callOptions } = await getBasicTestNeeds(accounts);

           await anchorRepository.commit(anchorId, documentRoot, centrifugeId, callOptions).then(function (tx) {
               assert.fail(0, 0, "Should not be able to commit an Anchor without a PreAnchor")
           }).catch(function (e) {
               assert.equal(e.message, "VM Exception while processing transaction: revert")
           })
       })


        it("should not allow committing an Anchor if the PreAnchor has expired ", async function() {
            const { anchorId, signingRoot,  documentRoot, centrifugeId, anchorRepository, callOptions } = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            await mineNBlocks(15);

            await anchorRepository.commit(anchorId, documentRoot, centrifugeId, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an Anchor with an expired PreAnchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

        })


        it("should not allow committing an Anchor if the PreAnchor has a different sender ", async function() {
            const { anchorId, signingRoot,  documentRoot, centrifugeId, anchorRepository, callOptions } = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, {from:accounts[1]}).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, documentRoot, centrifugeId, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an Anchor with an expired PreAnchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })
        })

        it("should allow committing an Anchor with a valid PreAnchor", async function() {
            const { anchorId, signingRoot,  documentRoot, centrifugeId, anchorRepository, callOptions } = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, documentRoot, centrifugeId, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {
                assert.fail(0, 0, e.message)
            })

        })

        it("should not allow committing an Anchor with a valid PreAnchor that has been precommitted before", async function() {
            const { anchorId, signingRoot,  documentRoot, centrifugeId, anchorRepository, callOptions } = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, documentRoot, centrifugeId, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {
                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, documentRoot, centrifugeId, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an Anchor that has been committed before")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

        })


        it("should commit an Anchor and retrieve the documentRoot", async function () {


            const { anchorId, signingRoot,  documentRoot, centrifugeId, anchorRepository, callOptions } = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, documentRoot, centrifugeId, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {
                assert.fail(0, 0, e.message)
            })

            let response = await anchorRepository.getAnchorById.call(anchorId, callOptions);
            assert.equal(anchorId, web3.toHex(response[0]));
            assert.equal(documentRoot, web3.toHex(response[1]));
            assert.equal(centrifugeId, web3.toHex(response[2]));
            assert.notEqual(0, response[3].toNumber());
        })

        it("should return an empty anchor for wrong anchorId", async function () {
            const { anchorRepository, callOptions } = await getBasicTestNeeds(accounts);
            const notExistingAnchorId = createRandomByte(32);

            let response = await anchorRepository.getAnchorById.call(notExistingAnchorId, callOptions);
            assert.equal(notExistingAnchorId, web3.toHex(response[0]));
            assert.equal(0, response[1].toNumber());
            assert.equal(0, response[2].toNumber());
            assert.equal(0, response[3].toNumber());
        })

    })
})
