const ACTION = require('./constants').ACTION;
const MerkleTree = require('openzeppelin-eth/test/helpers/merkleTree').MerkleTree;
const mineNBlocks = require('./tools/blockHeight').mineNBlocks;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const {keccak, bufferToHex, toBuffer} = require('ethereumjs-util');
const AnchorRepository = artifacts.require("AnchorRepository");
const Identity = artifacts.require("Identity");


async function getBasicTestNeeds(accounts) {

    const anchorId = web3.utils.randomHex(32);
    const elements = [web3.utils.randomHex(32), web3.utils.randomHex(32), web3.utils.randomHex(32), web3.utils.randomHex(32)];
    const merkleTree = new MerkleTree(elements);
    const documentRoot = merkleTree.getHexRoot();
    const proof = merkleTree.getHexProof(elements[0]);
    const signingRoot = bufferToHex(keccak(elements[0]));
    const expirationBlock = await web3.eth.getBlockNumber() + 15;

    return {
        anchorId,
        signingRoot,
        documentRoot,
        proof,
        expirationBlock,
        callOptions: {from: accounts[0]}
    }
}


contract("AnchorRepository", function (accounts) {

    before(async function () {
        this.anchorRepository  = await AnchorRepository.new();
        this.identity = await Identity.new(accounts[0]);
        await this.identity.addKey(accounts[2], ACTION, 1)

    });

    describe("Committing an anchor", async function () {

        it("should not allow a preCommit if for an anchorId already has a valid one", async function () {

            const {anchorId, signingRoot,  expirationBlock, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, expirationBlock, callOptions));
            await shouldRevert(this.anchorRepository.preCommit(anchorId, signingRoot, expirationBlock, callOptions));
        })

        it("should allow a commit without an existing precommit", async function () {
            const {anchorId, documentRoot, proof,  callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));
        })


        it("should not allow committing an Anchor if the PreAnchor has expired ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, expirationBlock, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, expirationBlock, callOptions));
            await mineNBlocks(15);
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));

        });

        it("should allow to override a preCommit for an expired preAnchor ", async function () {
            let {anchorId, signingRoot,  expirationBlock, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, expirationBlock, callOptions));
            await mineNBlocks(15);
            //create new expirationBlock and signature for precommit
            expirationBlock = await web3.eth.getBlockNumber() + 15;

            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, expirationBlock, callOptions));

        })


        it("should not allow committing an Anchor if the PreAnchor has a different msg.sender ", async function () {
            const {anchorId, signingRoot, documentRoot, proof,  expirationBlock, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, expirationBlock, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, proof, {from: accounts[1]}));
        })


        it("should not allow committing an Anchor if the precommit singingRoot does not belong to the documentRoot", async function () {
            const {anchorId, signingRoot, proof, expirationBlock, callOptions} = await getBasicTestNeeds(accounts);
            // Create another document
            const documentRoot = web3.utils.randomHex(32);

            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, expirationBlock, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions))
        })

        it("should not allow committing an Anchor with a valid PreAnchor that has been precommitted before", async function () {
            const {anchorId, signingRoot, documentRoot, proof, expirationBlock, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, expirationBlock, callOptions));
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));

        })


        it("should commit an Anchor and retrieve the documentRoot", async function () {

            const {anchorId, signingRoot, documentRoot, proof, expirationBlock, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, expirationBlock, callOptions));
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));

            let response = await this.anchorRepository.getAnchorById.call(anchorId, callOptions);
            assert.equal(anchorId, web3.utils.toHex(response[0]));
            assert.equal(documentRoot, response[1]);


        })

        it("should return an empty anchor for wrong anchorId", async function () {
            const {callOptions} = await getBasicTestNeeds(accounts);
            const notExistingAnchorId = web3.utils.randomHex(32);

            let response = await this.anchorRepository.getAnchorById.call(notExistingAnchorId, callOptions);
            assert.equal(notExistingAnchorId, web3.utils.toHex(response[0]));
            assert.equal("0x0000000000000000000000000000000000000000000000000000000000000000", response[1]);
        })
    });

    describe("check the gas cost for preCommit and commit", async function () {

        const preCommitMaxGas = 95000;
        const commitMaxGas = 80000
        it(`should have preCommit gas cost less then ${preCommitMaxGas} `, async function () {
            const {anchorId, signingRoot, expirationBlock, callOptions} = await getBasicTestNeeds(accounts);

            const preCommitGas = await this.anchorRepository.preCommit.estimateGas(anchorId, signingRoot, expirationBlock, callOptions);
            console.log('Actual preCommit gas cost:', preCommitGas)
            assert.isBelow(preCommitGas, preCommitMaxGas, `Gas Price for preCommit is to high`)
        })


        it(`should have commit with no precommit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, documentRoot, proof, callOptions} = await getBasicTestNeeds(accounts);

            const commitGas = await this.anchorRepository.commit.estimateGas(anchorId, documentRoot, proof, callOptions);
            console.log('Actual commit without precommit gas cost:', commitGas)

            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        })

        it(`should have commit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, signingRoot, documentRoot, proof, expirationBlock, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, expirationBlock, callOptions));
            const commitGas = await this.anchorRepository.commit.estimateGas(anchorId, documentRoot, proof, callOptions);
            console.log('Actual commit with precommit gas cost:', commitGas)

            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        })

    });
})

