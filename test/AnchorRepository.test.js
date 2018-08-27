import {ETH_MESSAGE_AUTH} from "./constants";

const createRandomByte = require('./tools/random').createRandomByte;
const mineNBlocks = require('./tools/blockHeight').mineNBlocks;
const MerkleTree = require('openzeppelin-solidity/test/helpers/merkleTree').default;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const shouldReturnWithMessage = require('./tools/assertTx').shouldReturnWithMessage;
const {keccak, bufferToHex, toBuffer} = require('ethereumjs-util');
const AnchorRepository = artifacts.require("AnchorRepository");
const Identity = artifacts.require("Identity");
let IdentityRegistry = artifacts.require("IdentityRegistry");

let deployedAnchorRepository;
let deployedIdentity;
let deployedIdentityRegistry;
let deployedCentrifugeId = createRandomByte(6);
let authPublicKey;

function createSignatureMessage(payloads) {
    let buffers = payloads.map((item) => {
        return toBuffer(item);
    })

    return bufferToHex(keccak(Buffer.concat(buffers)));
}

async function getBasicTestNeeds(accounts) {

    const anchorId = createRandomByte(32);
    const elements = [createRandomByte(32), createRandomByte(32), createRandomByte(32), createRandomByte(32)];
    const merkleTree = new MerkleTree(elements);
    const documentRoot = merkleTree.getHexRoot();
    const proof = merkleTree.getHexProof(elements[0]);
    const signingRoot = bufferToHex(keccak(elements[0]));

    const precommitToSign = createSignatureMessage([anchorId, signingRoot, deployedCentrifugeId]);
    const precommitSignature = await web3.eth.sign(authPublicKey, precommitToSign);

    const commitToSign = createSignatureMessage([anchorId, documentRoot, deployedCentrifugeId]);
    const commitSignature = await web3.eth.sign(authPublicKey, commitToSign);

    return {
        anchorId,
        signingRoot,
        documentRoot,
        proof,
        centrifugeId: deployedCentrifugeId,
        publicKey: authPublicKey,
        precommitSignature,
        commitSignature,
        anchorRepository: deployedAnchorRepository,
        callOptions: {from: accounts[0]}
    }
}


contract("AnchorRepository", function (accounts) {
    before(async function () {
        deployedAnchorRepository = await AnchorRepository.deployed();
        // Create Identity and add it to the IdentityRegistry
        deployedIdentityRegistry = await IdentityRegistry.deployed();
        deployedIdentity = await Identity.new(deployedCentrifugeId);
        await deployedIdentityRegistry.registerIdentity(deployedCentrifugeId, deployedIdentity.address);
        authPublicKey = accounts[1]
        await deployedIdentity.addKey(authPublicKey, ETH_MESSAGE_AUTH);

    });

    describe("Committing an anchor", async function () {

        it("should only allow fully filled PreAnchors to be recorded", async function () {
            const {anchorId, signingRoot, centrifugeId, publicKey, precommitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldRevert(anchorRepository.preCommit("", signingRoot, centrifugeId, publicKey, precommitSignature, callOptions));
            await shouldRevert(anchorRepository.preCommit(null, signingRoot, centrifugeId, publicKey, precommitSignature, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, "", centrifugeId, publicKey, precommitSignature, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, null, centrifugeId, publicKey, precommitSignature, callOptions))
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, "", publicKey, precommitSignature, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, null, publicKey, precommitSignature, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, "", precommitSignature, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, null, precommitSignature, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, publicKey, "", callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, publicKey, null, callOptions));


        })


        it("should only allow fully filled Anchors to be recorded", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, publicKey, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldRevert(anchorRepository.commit("", centrifugeId, documentRoot, proof, publicKey, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(null, centrifugeId, documentRoot, proof, publicKey, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, "", documentRoot, proof, publicKey, commitSignature, callOptions))
            await shouldRevert(anchorRepository.commit(anchorId, null, documentRoot, proof, publicKey, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, "", proof, publicKey, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, null, proof, publicKey, commitSignature, callOptions));
            await shouldReturnWithMessage(anchorRepository.commit(anchorId, centrifugeId, documentRoot, "", publicKey, commitSignature, callOptions), "value.forEach is not a function");
            await shouldReturnWithMessage(anchorRepository.commit(anchorId, centrifugeId, documentRoot, null, publicKey, commitSignature, callOptions), "Cannot read property 'length' of null");
            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, "", commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, null, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, publicKey, "", callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, publicKey, null, callOptions));
        })


        it("should not allow a preCommit if for an anchorId  already has a valid one", async function () {

            const {anchorId, signingRoot, centrifugeId, publicKey, precommitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, publicKey, precommitSignature, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, publicKey, precommitSignature, callOptions));
        })

        it("should allow a commit without an existing precommit", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, publicKey, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, publicKey, commitSignature, callOptions));
        })


        it("should not allow committing an Anchor if the PreAnchor has expired ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, publicKey, precommitSignature, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);


            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot,centrifugeId, publicKey, precommitSignature, callOptions));
            await mineNBlocks(15);
            await shouldRevert(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, publicKey, commitSignature, callOptions));

        })


        it("should not allow committing an Anchor if the PreAnchor has a different centrifugeId ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, publicKey, precommitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            const anotherCentrifugeId = createRandomByte(6);
            const commitToSign = createSignatureMessage([anchorId, documentRoot, anotherCentrifugeId]);
            const commitSignature = await web3.eth.sign(publicKey, commitToSign);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot,centrifugeId, publicKey, precommitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, documentRoot, anotherCentrifugeId, proof, publicKey, commitSignature, callOptions));
        })



        it("should not allow committing an Anchor if the precommit singingRoot does not belong to the documentRoot", async function () {
            const {anchorId, documentRoot, proof, centrifugeId, publicKey, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            // Create another document
            const signingRoot = createRandomByte(32);
            const precommitToSign = createSignatureMessage([anchorId, signingRoot, deployedCentrifugeId]);
            const precommitSignature = await web3.eth.sign(publicKey, precommitToSign);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot,centrifugeId, publicKey, precommitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, publicKey, commitSignature, callOptions))
        })

        it("should not allow committing an Anchor with a valid PreAnchor that has been precommitted before", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, publicKey, precommitSignature, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, publicKey, precommitSignature, callOptions));
            await shouldSucceed(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, publicKey, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, publicKey, commitSignature, callOptions));

        })


        it("should commit an Anchor and retrieve the documentRoot", async function () {


            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, publicKey, precommitSignature, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, publicKey, precommitSignature, callOptions));
            await shouldSucceed(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, publicKey, commitSignature, callOptions));

            let response = await anchorRepository.getAnchorById.call(anchorId, callOptions);
            assert.equal(anchorId, web3.toHex(response[0]));

            //solidity removes leading 0 from hexes in conversins
            //Make sure that the test do not fail because of that
            assert.equal(documentRoot, response[1]);
            assert.equal(centrifugeId,  web3.toHex(response[2]));


        })

         it("should return an empty anchor for wrong anchorId", async function () {
             const {anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
             const notExistingAnchorId = createRandomByte(32);

             let response = await anchorRepository.getAnchorById.call(notExistingAnchorId, callOptions);
             assert.equal(notExistingAnchorId, web3.toHex(response[0]));
             assert.equal(0x0, response[1]);
             assert.equal(0,response[2].toNumber());

         })

    })

    describe("check the gas cost for preCommit and commit", async function () {

        const preCommitMaxGas = 95000;
        const commitMaxGas = 80000
        it(`should have preCommit gas cost less then ${preCommitMaxGas} `, async function () {
            const {anchorId, signingRoot, centrifugeId, publicKey, precommitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            const preCommitGas = await anchorRepository.preCommit.estimateGas(anchorId, signingRoot,centrifugeId, publicKey, precommitSignature, callOptions);
            console.log('Actual preCommit gas cost:', preCommitGas)
            assert.isBelow(preCommitGas, preCommitMaxGas, `Gas Price for preCommit is to high`)
        })


        it(`should have commit with no precommit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, publicKey, precommitSignature, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            const commitGas = await anchorRepository.commit.estimateGas(anchorId, documentRoot, centrifugeId, proof, publicKey, commitSignature, callOptions);
            console.log('Actual commit without precommit gas cost:', commitGas)

            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        })

        it(`should have commit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, publicKey, precommitSignature, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot,centrifugeId, publicKey, precommitSignature, callOptions));

            const commitGas = await anchorRepository.commit.estimateGas(anchorId, documentRoot, centrifugeId, proof, publicKey, commitSignature, callOptions);
            console.log('Actual commit with precommit gas cost:', commitGas)

            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        })

    });
})

