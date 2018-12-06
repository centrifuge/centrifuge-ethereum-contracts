const ETH_MESSAGE_AUTH = require('./constants').ETH_MESSAGE_AUTH;
const MerkleTree = require('openzeppelin-eth/test/helpers/merkleTree').MerkleTree;
const mineNBlocks = require('./tools/blockHeight').mineNBlocks;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const {keccak, bufferToHex, toBuffer} = require('ethereumjs-util');
const AnchorRepository = artifacts.require("AnchorRepository");
const Identity = artifacts.require("Identity");


let authPublicKey;

function createSignatureMessage(payloads) {
    let buffers = payloads.map((item) => {
        return toBuffer(item);
    })

    return bufferToHex(keccak(Buffer.concat(buffers)));
}

async function getBasicTestNeeds(accounts) {

    const anchorId = web3.utils.randomHex(32);
    const elements = [web3.utils.randomHex(32), web3.utils.randomHex(32), web3.utils.randomHex(32), web3.utils.randomHex(32)];
    const merkleTree = new MerkleTree(elements);
    const documentRoot = merkleTree.getHexRoot();
    const proof = merkleTree.getHexProof(elements[0]);
    const signingRoot = bufferToHex(keccak(elements[0]));
    const expirationBlock = await web3.eth.getBlockNumber() + 15;

    const hex = web3.utils.toHex(expirationBlock).slice(2);
    const zeroFilled = '0x' + new Array(65 - hex.length).join('0') + hex

    const precommitToSign = createSignatureMessage([anchorId, signingRoot, deployedCentrifugeId, zeroFilled]);
    const precommitSignature = await web3.eth.sign(precommitToSign, authPublicKey);

    const commitToSign = createSignatureMessage([anchorId, documentRoot, deployedCentrifugeId]);
    const commitSignature = await web3.eth.sign(commitToSign, authPublicKey);

    return {
        anchorId,
        signingRoot,
        documentRoot,
        proof,
        centrifugeId: deployedCentrifugeId,
        publicKey: authPublicKey,
        expirationBlock,
        precommitSignature,
        commitSignature,
        anchorRepository: this.anchorRepository,
        callOptions: {from: accounts[0]}
    }
}


contract("AnchorRepository", function (accounts) {

    before(async function () {
        this.anchorRepository  = await AnchorRepository.new();
        await this.anchorRepository.initialize();

        const deployedIdentity = await Identity.new();
        deployedCentrifugeId = deployedIdentity.address;
        authPublicKey = accounts[1];
        await deployedIdentity.addKey(authPublicKey, ETH_MESSAGE_AUTH)

    });

    describe("Committing an anchor", async function () {

        it("should only allow fully filled PreAnchors to be recorded", async function () {
            const {anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldRevert(this.anchorRepository.preCommit("0x0", signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldRevert(this.anchorRepository.preCommit(anchorId, "0x0", centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldRevert(this.anchorRepository.preCommit(anchorId, signingRoot, "0x0000000000000000000000000000000000000000", precommitSignature, expirationBlock, callOptions));
            await shouldRevert(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, "0x0", expirationBlock, callOptions));
            await shouldRevert(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, "0x0", callOptions));

        })


        it("should only allow fully filled Anchors to be recorded", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldRevert(this.anchorRepository.commit("0x0", documentRoot, centrifugeId, proof, commitSignature, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, "0x0", centrifugeId, proof, commitSignature, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, "0x0000000000000000000000000000000000000000", proof, commitSignature, callOptions))
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, "0x0", callOptions));
        })


        it("should not allow a preCommit if for an anchorId  already has a valid one", async function () {

            const {anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));

            await shouldRevert(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
        })

        it("should allow a commit without an existing precommit", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));
        })


        it("should not allow committing an Anchor if the PreAnchor has expired ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await mineNBlocks(15);
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));

        })

        it("should not allow replay attack for preCommit ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await mineNBlocks(15);
            await shouldRevert(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
        })

        it("should allow to override a preCommit for an expired anchor with a new signature ", async function () {
            let {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await mineNBlocks(15);
            //create new expirationBlock and signature for precommit
            expirationBlock = await web3.eth.getBlockNumber() + 15;
            const hex = web3.utils.toHex(expirationBlock).slice(2);
            const zeroFilled = '0x' + new Array(65 - hex.length).join('0') + hex
            const precommitToSign = createSignatureMessage([anchorId, signingRoot, deployedCentrifugeId, zeroFilled]);
            precommitSignature = await web3.eth.sign(precommitToSign, authPublicKey);

            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));

        })


        it("should not allow committing an Anchor if the PreAnchor has a different centrifugeId ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, publicKey, precommitSignature, expirationBlock, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            const anotherCentrifugeId = web3.utils.randomHex(20);
            const commitToSign = createSignatureMessage([anchorId, documentRoot, anotherCentrifugeId]);
            const commitSignature = await web3.eth.sign(commitToSign, publicKey);

            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, anotherCentrifugeId, proof, commitSignature, callOptions));
        })


        it("should not allow committing an Anchor if the precommit singingRoot does not belong to the documentRoot", async function () {
            const {anchorId, signingRoot, proof, centrifugeId, precommitToSign, precommitSignature, publicKey, expirationBlock, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            // Create another document
            const documentRoot = web3.utils.randomHex(32);
            const commitToSign = createSignatureMessage([anchorId, documentRoot, centrifugeId]);
            const commitSignature = await web3.eth.sign(commitToSign, publicKey);

            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions))
        })

        it("should not allow committing an Anchor with a valid PreAnchor that has been precommitted before", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));
            await shouldRevert(this.anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));

        })


        it("should commit an Anchor and retrieve the documentRoot", async function () {


            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldSucceed(this.anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));

            let response = await this.anchorRepository.getAnchorById.call(anchorId, callOptions);
            assert.equal(anchorId, web3.utils.toHex(response[0]));

            //solidity removes leading 0 from hexes in conversins
            //Make sure that the test do not fail because of that
            assert.equal(documentRoot, response[1]);
            assert.equal(centrifugeId, response[2]);


        })

        it("should return an empty anchor for wrong anchorId", async function () {
            const {anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            const notExistingAnchorId = web3.utils.randomHex(32);

            let response = await this.anchorRepository.getAnchorById.call(notExistingAnchorId, callOptions);
            assert.equal(notExistingAnchorId, web3.utils.toHex(response[0]));
            assert.equal("0x0000000000000000000000000000000000000000000000000000000000000000", response[1]);
            assert.equal("0x0000000000000000000000000000000000000000", response[2]);

        })

    })
    describe("check the gas cost for preCommit and commit", async function () {

        const preCommitMaxGas = 95000;
        const commitMaxGas = 80000
        it(`should have preCommit gas cost less then ${preCommitMaxGas} `, async function () {
            const {anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            const preCommitGas = await this.anchorRepository.preCommit.estimateGas(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions);
            console.log('Actual preCommit gas cost:', preCommitGas)
            assert.isBelow(preCommitGas, preCommitMaxGas, `Gas Price for preCommit is to high`)
        })


        it(`should have commit with no precommit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            const commitGas = await this.anchorRepository.commit.estimateGas(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions);
            console.log('Actual commit without precommit gas cost:', commitGas)

            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        })

        it(`should have commit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));

            const commitGas = await this.anchorRepository.commit.estimateGas(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions);
            console.log('Actual commit with precommit gas cost:', commitGas)

            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        })

    });
})

