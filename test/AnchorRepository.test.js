const createRandomByte = require('./tools/random').createRandomByte;
const mineNBlocks = require('./tools/blockHeight').mineNBlocks;
const MerkleTree = require('openzeppelin-solidity/test/helpers/merkleTree').default;
const {sha3, bufferToHex} = require('ethereumjs-util');
const AnchorRepository = artifacts.require("AnchorRepository");


let deployedAnchorRepository;

async function getBasicTestNeeds(accounts) {

    const elements = [createRandomByte(32), createRandomByte(32), createRandomByte(32), createRandomByte(32)];
    const merkleTree = new MerkleTree(elements);
    const documentRoot = merkleTree.getHexRoot();
    const proof = merkleTree.getHexProof(elements[0]);
    const signingRoot = bufferToHex(sha3(elements[0]));

    return {
        anchorId: createRandomByte(32),
        nextAnchorId: createRandomByte(8),
        signingRoot,
        documentRoot,
        proof,
        centrifugeId: createRandomByte(8),
        anchorRepository: deployedAnchorRepository,
        callOptions: {from: accounts[0]}
    }
}

contract("AnchorRepository", function (accounts) {
    before(async function () {
        deployedAnchorRepository = await AnchorRepository.deployed();
    });

    describe("Committing an anchor", async function () {

        it("should only allow fully filled PreAnchors to be recorded", async function () {
            const {anchorId, signingRoot, documentRoot, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

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
            const {anchorId, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await anchorRepository.commit("", centrifugeId, documentRoot, proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(null, centrifugeId, documentRoot, proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(anchorId, "", documentRoot, proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(anchorId, null, documentRoot, proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(anchorId, centrifugeId, "", proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(anchorId, centrifugeId, null, proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

            await anchorRepository.commit(anchorId, centrifugeId, documentRoot, "", callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "value.forEach is not a function")
            })

            await anchorRepository.commit(anchorId, centrifugeId, documentRoot, null, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an incomplete Anchor")
            }).catch(function (e) {
                assert.equal(e.message, "Cannot read property 'length' of null")
            })

        })


        it("should not allow a preCommit if for an anchorId  already has a valid one", async function () {

            const {anchorId, signingRoot, documentRoot, centrifugeId, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

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

        it("should not allow a commit without an existing precommit", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an Anchor without a PreAnchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })
        })


        it("should not allow committing an Anchor if the PreAnchor has expired ", async function () {
            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            await mineNBlocks(15);

            await anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an Anchor with an expired PreAnchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

        })


        it("should not allow committing an Anchor if the PreAnchor has a different sender ", async function () {
            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, {from: accounts[1]}).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an Anchor with an expired PreAnchor")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })
        })

        it("should allow committing an Anchor with a valid PreAnchor", async function () {
            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {
                assert.fail(0, 0, e.message)
            })

        })

        it("should allow committing an Anchor uf the precommit singingRoot does belong to the documentRoot", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            const signingRoot = createRandomByte(32);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {
                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "documentRoot should include the signing root from the preCommit")

            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

        })

        it("should not allow committing an Anchor with a valid PreAnchor that has been precommitted before", async function () {
            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {
                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions).then(function (tx) {
                assert.fail(0, 0, "Should not be able to commit an Anchor that has been committed before")
            }).catch(function (e) {
                assert.equal(e.message, "VM Exception while processing transaction: revert")
            })

        })


        it("should commit an Anchor and retrieve the documentRoot", async function () {


            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            await anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {
                assert.fail(0, 0, e.message)
            })

            let response = await anchorRepository.getAnchorById.call(anchorId, callOptions);
            assert.equal(anchorId, web3.toHex(response[0]));
            assert.equal(documentRoot, web3.toHex(response[1]));
            //assert.equal(centrifugeId, web3.toHex(response[2]));
            assert.notEqual(0, response[2].toNumber());
        })

        it("should return an empty anchor for wrong anchorId", async function () {
            const {anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            const notExistingAnchorId = createRandomByte(32);

            let response = await anchorRepository.getAnchorById.call(notExistingAnchorId, callOptions);
            assert.equal(notExistingAnchorId, web3.toHex(response[0]));
            assert.equal(0, response[1].toNumber());
           // assert.equal(0, response[2].toNumber());
            assert.equal(0, response[2].toNumber());
        })

    })

    describe("check the gas cost for preCommit and commit", async function () {

        const maxGas = 80000;
        it(`should have preCommit gas cost less then ${maxGas} `, async function () {
            const {anchorId, signingRoot, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            const preCommitGas = await anchorRepository.preCommit.estimateGas(anchorId, signingRoot, callOptions);
            console.log('Actual preCommit gas cost:', preCommitGas)
            assert.isBelow(preCommitGas, maxGas, `Gas Price for preCommit is to high`)
        })

        it(`should have commit gas cost less then  ${maxGas}`, async function () {
            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await anchorRepository.preCommit(anchorId, signingRoot, callOptions).then(function (tx) {
                assert.equal(tx.receipt.status, 1)
                return tx
            }).catch(function (e) {

                assert.fail(0, 0, e.message)
            })

            const commitGas = await anchorRepository.commit.estimateGas(anchorId, centrifugeId, documentRoot, proof, callOptions);
            console.log('Actual commit gas cost:', commitGas)

            assert.isBelow(commitGas, maxGas, 'Gas Price for commit must not exceed 80k');
        })

    });
})

