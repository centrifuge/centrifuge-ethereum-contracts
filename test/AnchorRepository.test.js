const createRandomByte = require('./tools/random').createRandomByte;
const mineNBlocks = require('./tools/blockHeight').mineNBlocks;
const MerkleTree = require('openzeppelin-solidity/test/helpers/merkleTree').default;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const shouldReturnWithMessage = require('./tools/assertTx').shouldReturnWithMessage;
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
        signingRoot,
        documentRoot,
        proof,
        centrifugeId: createRandomByte(6),
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

            await shouldRevert(anchorRepository.preCommit("", signingRoot, callOptions));

            await shouldRevert(anchorRepository.preCommit(null, signingRoot, callOptions));

            await shouldRevert(anchorRepository.preCommit(anchorId, "", callOptions));

            await shouldRevert(anchorRepository.preCommit(anchorId, null, callOptions))

        })


        it("should only allow fully filled Anchors to be recorded", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldRevert(anchorRepository.commit("", centrifugeId, documentRoot, proof, callOptions));

            await shouldRevert(anchorRepository.commit(null, centrifugeId, documentRoot, proof, callOptions));

            await shouldRevert(anchorRepository.commit(anchorId, "", documentRoot, proof, callOptions))

            await shouldRevert(anchorRepository.commit(anchorId, null, documentRoot, proof, callOptions));

            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, "", proof, callOptions));

            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, null, proof, callOptions));

            await shouldReturnWithMessage(anchorRepository.commit(anchorId, centrifugeId, documentRoot, "", callOptions), "value.forEach is not a function");

            await shouldReturnWithMessage(anchorRepository.commit(anchorId, centrifugeId, documentRoot, null, callOptions), "Cannot read property 'length' of null");

        })


        it("should not allow a preCommit if for an anchorId  already has a valid one", async function () {

            const {anchorId, signingRoot, documentRoot, centrifugeId, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, callOptions));

            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, callOptions));
        })

        it("should not allow a commit without an existing precommit", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions));
        })


        it("should not allow committing an Anchor if the PreAnchor has expired ", async function () {
            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, callOptions));

            await mineNBlocks(15);

            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions));

        })


        it("should not allow committing an Anchor if the PreAnchor has a different sender ", async function () {
            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, {from: accounts[1]}));

            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions));
        })

        it("should allow committing an Anchor with a valid PreAnchor", async function () {
            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, callOptions));

            await shouldSucceed(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions));

        })

        it("should allow committing an Anchor uf the precommit singingRoot does belong to the documentRoot", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            const signingRoot = createRandomByte(32);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, callOptions));

            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions))
        })

        it("should not allow committing an Anchor with a valid PreAnchor that has been precommitted before", async function () {
            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, callOptions));

            await shouldSucceed(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions));

            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions))

        })


        it("should commit an Anchor and retrieve the documentRoot", async function () {


            const {anchorId, signingRoot, documentRoot, centrifugeId, proof, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, callOptions));

            await shouldSucceed(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, callOptions));

            let response = await anchorRepository.getAnchorById.call(anchorId, callOptions);
            assert.equal(anchorId, web3.toHex(response[0]));

            //solidity removes leading 0 from hexes in conversins
            //Make sure that the test do not fail because of that
            assert.equal(web3.toHex(web3.toBigNumber(documentRoot)), web3.toHex(response[1]));
            assert.equal(accounts[0], response[2]);
        })

        it("should return an empty anchor for wrong anchorId", async function () {
            const {anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            const notExistingAnchorId = createRandomByte(32);

            let response = await anchorRepository.getAnchorById.call(notExistingAnchorId, callOptions);
            assert.equal(notExistingAnchorId, web3.toHex(response[0]));
            assert.equal(0, response[1].toNumber());
            assert.equal('0x0000000000000000000000000000000000000000', response[2]);

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

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, callOptions));

            const commitGas = await anchorRepository.commit.estimateGas(anchorId, centrifugeId, documentRoot, proof, callOptions);
            console.log('Actual commit gas cost:', commitGas)

            assert.isBelow(commitGas, maxGas, 'Gas Price for commit must not exceed 80k');
        })

    });
})

