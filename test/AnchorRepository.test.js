const ACTION = require('./constants').ACTION;
const MerkleTree = require('./tools/merkleTree').MerkleTree;
const mineNBlocks = require('./tools/blockHeight').mineNBlocks;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const {keccak, bufferToHex, sha256, toUnsigned} = require('ethereumjs-util');
const AnchorRepository = artifacts.require("AnchorRepository");
const Identity = artifacts.require("Identity");



async function getBasicTestNeeds(accounts) {

    const anchorId = web3.utils.randomHex(32);
    const elements = [web3.utils.randomHex(32), web3.utils.randomHex(32)];
    const merkleTree = new MerkleTree(elements, sha256);
    const documentRoot = merkleTree.getHexRoot();
    const proof = merkleTree.getHexProof(elements[0])[0];
    const signingRoot = bufferToHex(sha256(elements[0]));

    console.log(proof);

    return {
        anchorId,
        signingRoot,
        documentRoot,
        proof,
        callOptions: {from: accounts[0]}
    }
}


contract("AnchorRepository", function (accounts) {

    before(async function () {
        this.anchorRepository  = await AnchorRepository.new();
        this.identity = await Identity.new(accounts[0],[],[]);
        await this.identity.addKey(accounts[2], ACTION, 1)

    });

    describe("Committing an anchor", async function () {

        it("should not allow a preCommit if for an anchorId already has a valid one", async function () {

            const {anchorId, signingRoot, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(sha256(anchorId), signingRoot, callOptions));
            await shouldRevert(this.anchorRepository.preCommit(sha256(anchorId), signingRoot, callOptions));
        });

        it("should not allow a preCommit if the singningRoot is 0x0", async function () {

            const {anchorId, signingRoot, callOptions} = await getBasicTestNeeds(accounts);
            await shouldRevert(
                this.anchorRepository.preCommit(sha256(anchorId), "0x0000000000000000000000000000000000000000000000000000000000000000", callOptions),
                "Signing Root can not be 0x0"
            );
        });

        it("should allow a commit without an existing precommit", async function () {
            const {anchorId, documentRoot, proof,  callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));
        });

        it("should not allow a commit with 0 value for the document root", async function () {
            const {anchorId, documentRoot, proof,  callOptions} = await getBasicTestNeeds(accounts);
            await shouldRevert(
                this.anchorRepository.commit(anchorId, "0x0000000000000000000000000000000000000000000000000000000000000000", proof, callOptions),
                "Document Root can not be 0x0"
            );
        });


        it("should allow committing an Anchor if the PreAnchor has expired ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(sha256(anchorId), signingRoot, callOptions));
            await mineNBlocks(15);
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));
        });

        it("should allow to override a preCommit for an expired preAnchor ", async function () {
            let {anchorId, signingRoot, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(this.anchorRepository.preCommit(sha256(anchorId), signingRoot, callOptions));
            await mineNBlocks(480);
            await shouldSucceed(this.anchorRepository.preCommit(sha256(anchorId), signingRoot, callOptions));
        });


        it("should not allow committing an Anchor if the PreAnchor has a different msg.sender ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(this.anchorRepository.preCommit(sha256(anchorId), signingRoot, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, proof, {from: accounts[1]}));
        });


        it("should not allow committing an Anchor if the precommit singingRoot does not belong to the documentRoot", async function () {
            const {anchorId, signingRoot, proof, callOptions} = await getBasicTestNeeds(accounts);
            // Create another document
            const documentRoot = web3.utils.randomHex(32);

            await shouldSucceed(this.anchorRepository.preCommit(sha256(anchorId), signingRoot, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions))
        });

        it("should not allow committing an Anchor with a valid PreAnchor that has been precommitted before", async function () {
            const {anchorId, signingRoot, documentRoot, proof, callOptions} = await getBasicTestNeeds(accounts);
            const hashedAnchorId = sha256(anchorId);

            await shouldSucceed(this.anchorRepository.preCommit(hashedAnchorId, signingRoot, callOptions));
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));

        });

        it("should not allow precommitting an Anchor that has been committed before", async function () {
            const {anchorId, signingRoot, documentRoot, proof, callOptions} = await getBasicTestNeeds(accounts);
            const hashedAnchorId = sha256(anchorId);

            await shouldSucceed(this.anchorRepository.preCommit(hashedAnchorId, signingRoot, callOptions));
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));
            await shouldRevert(this.anchorRepository.preCommit(hashedAnchorId, signingRoot, callOptions));

        });


        it("should commit an Anchor and retrieve the documentRoot", async function () {
            const {anchorId, signingRoot, documentRoot, proof, callOptions} = await getBasicTestNeeds(accounts);
            const hashedAnchorId = sha256(anchorId);

            await shouldSucceed(this.anchorRepository.preCommit(hashedAnchorId, signingRoot, callOptions));
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, proof, callOptions));

            let response = await this.anchorRepository.getAnchorById.call(hashedAnchorId, callOptions);
            assert.equal(bufferToHex(hashedAnchorId), web3.utils.toHex(response[0]));
            assert.equal(documentRoot, response[1]);

            let blckNoResponse = await this.anchorRepository.getAnchorById.call(hashedAnchorId, callOptions);
            assert.equal(bufferToHex(hashedAnchorId), web3.utils.toHex(blckNoResponse[0]));
            assert.equal(documentRoot, blckNoResponse[1]);
            assert.isTrue(blckNoResponse[2].gt(0));
        });

        it("should return an empty anchor for wrong anchorId", async function () {
            const {callOptions} = await getBasicTestNeeds(accounts);
            const notExistingAnchorId = web3.utils.randomHex(32);

            let response = await this.anchorRepository.getAnchorById.call(notExistingAnchorId, callOptions);
            assert.equal(notExistingAnchorId, web3.utils.toHex(response[0]));
            assert.equal("0x0000000000000000000000000000000000000000000000000000000000000000", response[1]);
        })
    });

});

