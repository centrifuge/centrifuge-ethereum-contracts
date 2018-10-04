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

function getDeterministCommitParameter(accounts) {
    return {
        anchorId: "0x154cc26833dec2f4ad7ead9d65f9ec968a1aa5efbf6fe762f8f2a67d18a2d9b1",
        documentRoot: "0x65a35574f70281ae4d1f6c9f3adccd5378743f858c67a802a49a08ce185bc975",
        proof: [ '0x5a02f3555c92e495fd9b0e790d9b18794160e8a2087a2bec9066cc2d533bc3cd',
        '0x58b05c048002cc9e861250f2e467f3883e2660c04e7e8c66edaa55db11dbc52c' ],
        centrifugeId: "0x1851943e76d2",
        publicKey: authPublicKey,
        commitSignature: "0xb4051d6d03c3bf39f4ec4ba949a91a358b0cacb4804b82ed2ba978d338f5e747770c00b63c8e50c1a7aa5ba629870b54c2068a56f8b43460aa47891c6635d36d01",
        anchorRepository: deployedAnchorRepository,
        callOptions: {from: accounts[0]}
    }
}

async function getBasicTestNeeds(accounts) {

    const anchorId = createRandomByte(32);
    const elements = [createRandomByte(32), createRandomByte(32), createRandomByte(32), createRandomByte(32)];
    const merkleTree = new MerkleTree(elements);
    const documentRoot = merkleTree.getHexRoot();
    const proof = merkleTree.getHexProof(elements[0]);
    const signingRoot = bufferToHex(keccak(elements[0]));
    const expirationBlock = web3.eth.blockNumber + 15;

    const hex = web3.toHex(expirationBlock).slice(2);
    const zeroFilled = '0x' + new Array(65 - hex.length).join('0') + hex

    const precommitToSign = createSignatureMessage([anchorId, signingRoot, deployedCentrifugeId, zeroFilled]);
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
        expirationBlock,
        precommitSignature,
        commitSignature,
        anchorRepository: deployedAnchorRepository,
        callOptions: {from: accounts[0]}
    }
}


contract("AnchorRepository", function (accounts) {
    before(async function () {

        // Create Identity and add it to the IdentityRegistry
        deployedIdentityRegistry = await IdentityRegistry.deployed();
        deployedAnchorRepository = await AnchorRepository.deployed();
        deployedIdentity = await Identity.new(deployedCentrifugeId);
        await deployedIdentityRegistry.registerIdentity(deployedCentrifugeId, deployedIdentity.address);
        authPublicKey = accounts[1]
        await deployedIdentity.addKey(authPublicKey, ETH_MESSAGE_AUTH)

    });

    describe("Committing an anchor", async function () {

        it("should only allow fully filled PreAnchors to be recorded", async function () {
            const {anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldRevert(anchorRepository.preCommit("", signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldRevert(anchorRepository.preCommit(null, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, "", centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, null, centrifugeId, precommitSignature, expirationBlock, callOptions))
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, "", precommitSignature, expirationBlock, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, null, precommitSignature, expirationBlock, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, "", expirationBlock, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, null, expirationBlock, callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, "", callOptions));
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, null, callOptions));

        })


        it("should only allow fully filled Anchors to be recorded", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldRevert(anchorRepository.commit("", centrifugeId, documentRoot, proof, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(null, centrifugeId, documentRoot, proof, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, "", documentRoot, proof, commitSignature, callOptions))
            await shouldRevert(anchorRepository.commit(anchorId, null, documentRoot, proof, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, "", proof, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, null, proof, commitSignature, callOptions));
            await shouldReturnWithMessage(anchorRepository.commit(anchorId, centrifugeId, documentRoot, "", commitSignature, callOptions), "value.forEach is not a function");
            await shouldReturnWithMessage(anchorRepository.commit(anchorId, centrifugeId, documentRoot, null, commitSignature, callOptions), "Cannot read property 'length' of null");
            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, "", callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, centrifugeId, documentRoot, proof, null, callOptions));
        })


        it("should not allow a preCommit if for an anchorId  already has a valid one", async function () {

            const {anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));

            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
        })

        it("should allow a commit without an existing precommit", async function () {
            const {anchorId, documentRoot, centrifugeId, proof, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));
        })


        it("should not allow committing an Anchor if the PreAnchor has expired ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await mineNBlocks(15);
            await shouldRevert(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));

        })

        it("should not allow replay attack for preCommit ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await mineNBlocks(15);
            await shouldRevert(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
        })

        it("should allow to override a preCommit for an expired anchor with a new signature ", async function () {
            let {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await mineNBlocks(15);
            //create new expirationBlock and signature for precommit
            expirationBlock = web3.eth.blockNumber + 15;
            const hex = web3.toHex(expirationBlock).slice(2);
            const zeroFilled = '0x' + new Array(65 - hex.length).join('0') + hex
            const precommitToSign = createSignatureMessage([anchorId, signingRoot, deployedCentrifugeId, zeroFilled]);
            precommitSignature = await web3.eth.sign(authPublicKey, precommitToSign);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));

        })


        it("should not allow committing an Anchor if the PreAnchor has a different centrifugeId ", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, publicKey, precommitSignature, expirationBlock, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            const anotherCentrifugeId = createRandomByte(6);
            const commitToSign = createSignatureMessage([anchorId, documentRoot, anotherCentrifugeId]);
            const commitSignature = await web3.eth.sign(publicKey, commitToSign);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, documentRoot, anotherCentrifugeId, proof, commitSignature, callOptions));
        })


        it("should not allow committing an Anchor if the precommit singingRoot does not belong to the documentRoot", async function () {
            const {anchorId, signingRoot, proof, centrifugeId, precommitToSign, precommitSignature, publicKey, expirationBlock, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            // Create another document
            const documentRoot = createRandomByte(32);
            const commitToSign = createSignatureMessage([anchorId, documentRoot, centrifugeId]);
            const commitSignature = await web3.eth.sign(publicKey, commitToSign);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions))
        })

        it("should not allow committing an Anchor with a valid PreAnchor that has been precommitted before", async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldSucceed(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));
            await shouldRevert(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));

        })


        it("should commit an Anchor and retrieve the documentRoot", async function () {


            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));
            await shouldSucceed(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));

            let response = await anchorRepository.getAnchorById.call(anchorId, callOptions);
            assert.equal(anchorId, web3.toHex(response[0]));

            //solidity removes leading 0 from hexes in conversins
            //Make sure that the test do not fail because of that
            assert.equal(documentRoot, response[1]);
            assert.equal(centrifugeId, web3.toHex(response[2]));


        })

        it("should return an empty anchor for wrong anchorId", async function () {
            const {anchorRepository, callOptions} = await getBasicTestNeeds(accounts);
            const notExistingAnchorId = createRandomByte(32);

            let response = await anchorRepository.getAnchorById.call(notExistingAnchorId, callOptions);
            assert.equal(notExistingAnchorId, web3.toHex(response[0]));
            assert.equal(0x0, response[1]);
            assert.equal(0, response[2].toNumber());

        })

        it("should test commit transaction with deterministic parameter", async function () {

            const testCentrifugeId = "0x1851943e76d2";
            let testDeployedIdentity = await Identity.new(testCentrifugeId);
            await deployedIdentityRegistry.registerIdentity(testCentrifugeId, testDeployedIdentity.address);
            authPublicKey = accounts[1]
            await testDeployedIdentity.addKey(authPublicKey, ETH_MESSAGE_AUTH)
          
            const {anchorId, documentRoot, proof, centrifugeId,  commitSignature, anchorRepository, callOptions} = getDeterministCommitParameter(accounts);
            
            await shouldSucceed(anchorRepository.commit(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions));
            let response = await anchorRepository.getAnchorById.call(anchorId, callOptions);
            
            assert.equal(anchorId, web3.toHex(response[0]));
        })

    })
    describe("check the gas cost for preCommit and commit", async function () {

        const preCommitMaxGas = 95000;
        const commitMaxGas = 80000
        it(`should have preCommit gas cost less then ${preCommitMaxGas} `, async function () {
            const {anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            const preCommitGas = await anchorRepository.preCommit.estimateGas(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions);
            console.log('Actual preCommit gas cost:', preCommitGas)
            assert.isBelow(preCommitGas, preCommitMaxGas, `Gas Price for preCommit is to high`)
        })


        it(`should have commit with no precommit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            const commitGas = await anchorRepository.commit.estimateGas(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions);
            console.log('Actual commit without precommit gas cost:', commitGas)

            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        })

        it(`should have commit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, signingRoot, documentRoot, proof, centrifugeId, precommitSignature, expirationBlock, commitSignature, anchorRepository, callOptions} = await getBasicTestNeeds(accounts);

            await shouldSucceed(anchorRepository.preCommit(anchorId, signingRoot, centrifugeId, precommitSignature, expirationBlock, callOptions));

            const commitGas = await anchorRepository.commit.estimateGas(anchorId, documentRoot, centrifugeId, proof, commitSignature, callOptions);
            console.log('Actual commit with precommit gas cost:', commitGas)

            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        })

    });
})

