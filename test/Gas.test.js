const {ACTION, P2P_IDENTITY, P2P_SIGNATURE} = require('./constants');
const MerkleTree = require('./tools/merkleTree').MerkleTree;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const addressToBytes32 = require('./tools/utils').addressToBytes32;
const {keccak, bufferToHex, toBuffer, sha256} = require('ethereumjs-util');
const IdentityFactory = artifacts.require("MockIdentityFactory");
const AnchorRepository = artifacts.require("AnchorRepository");
const Identity = artifacts.require("Identity");
const MockPaymentObligation = artifacts.require("MockPaymentObligation");
const proof = require('./erc721/proof');

async function getBasicTestNeeds(accounts) {

    const anchorId = web3.utils.randomHex(32);
    const elements = [web3.utils.randomHex(32), web3.utils.randomHex(32), web3.utils.randomHex(32), web3.utils.randomHex(32)];
    const merkleTree = new MerkleTree(elements, sha256);
    const documentRoot = merkleTree.getHexRoot();
    const proof = merkleTree.getHexProof(elements[0]);
    const signingRoot = bufferToHex(sha256(elements[0]));

    return {
        anchorId,
        signingRoot,
        documentRoot,
        proof,
        key: web3.utils.randomHex(32),
        callOptions: {from: accounts[0]}
    }
}


contract("Gas costs", function (accounts) {

    let {
        grossAmount,
        currency,
        due_date,
        sender,
        status,
        nextVersion,
        nftUnique,
        readRole,
        readRoleAction,
        tokenRole,
        tokenId,
        documentIdentifier,
        validRootHash,
        contractAddress,
        tokenURI,
        poMintParams,
        publicKey
    } = proof;

    let nextDocumentIdentifier = nextVersion.value;

    // Anchor repository commit requires the preImage
    let docIdPreImage = documentIdentifier;
    documentIdentifier = sha256(docIdPreImage);

    beforeEach(async function () {
        this.anchorRepository = await AnchorRepository.new();
        this.identity = await Identity.new(accounts[0],[publicKey,addressToBytes32(accounts[1])],[P2P_SIGNATURE,ACTION]);
        this.identityFactory = await IdentityFactory.new();
        this.poRegistry = await MockPaymentObligation.new(this.anchorRepository.address,this.identityFactory.address);

    });

    describe("Check the gas cost for preCommit and commit", async function () {

        const preCommitMaxGas = 95000;
        const commitMaxGas = 80000;
        it(`should have preCommit gas cost less then ${preCommitMaxGas} `, async function () {
            const {anchorId, signingRoot, callOptions} = await getBasicTestNeeds(accounts);
            const preCommitGas = await this.anchorRepository.preCommit.estimateGas(anchorId, signingRoot, callOptions);

            console.log('Actual preCommit gas cost:', preCommitGas);
            assert.isBelow(preCommitGas, preCommitMaxGas, `Gas Price for preCommit is to high`)
        });


        it(`should have commit with no precommit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, documentRoot, proof, callOptions} = await getBasicTestNeeds(accounts);
            const commitGas = await this.anchorRepository.commit.estimateGas(anchorId, documentRoot, proof, callOptions);

            console.log('Actual commit without precommit gas cost:', commitGas);
            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        });

        it(`should have commit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, signingRoot, documentRoot, proof, callOptions} = await getBasicTestNeeds(accounts);
            await shouldSucceed(this.anchorRepository.preCommit(anchorId, signingRoot, callOptions));
            const commitGas = await this.anchorRepository.commit.estimateGas(anchorId, documentRoot, proof, callOptions);

            console.log('Actual commit with precommit gas cost:', commitGas);
            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        })

    });

    describe("Check the gas cost for preCommit and commit with the identity proxy for ACTION key", async function () {

        const preCommitMaxGas = 95000;
        const commitMaxGas = 85000;
        it(`should have preCommit gas cost less then ${preCommitMaxGas} `, async function () {
            const {anchorId, signingRoot, callOptions} = await getBasicTestNeeds(accounts);

            const data = await this.anchorRepository.contract.methods.preCommit(anchorId, signingRoot).encodeABI();
            const preCommitGas = await this.identity.execute.estimateGas(this.anchorRepository.address, 0, data, {from: accounts[1]});
            console.log('Actual preCommit gas cost:', preCommitGas);
            assert.isBelow(preCommitGas, preCommitMaxGas, `Gas Price for preCommit is to high`)
        });

        it(`should have commit with no precommit gas cost less then  ${commitMaxGas}`, async function () {
            const {anchorId, documentRoot, proof, callOptions} = await getBasicTestNeeds(accounts);
            const data = await this.anchorRepository.contract.methods.commit(anchorId, documentRoot, proof).encodeABI();
            const commitGas = await this.identity.execute.estimateGas(this.anchorRepository.address, 0, data, {from: accounts[1]});

            console.log('Actual commit without precommit gas cost:', commitGas);
            assert.isBelow(commitGas, commitMaxGas, 'Gas Price for commit must not exceed 80k');
        })


    });

    describe("Check the gas cost for identity creation", async function () {
        const maxGas = 1200000;
        it(`should have preCommit gas cost less then ${maxGas} `, async function () {
            const actualGas = await this.identityFactory.createIdentity.estimateGas({from: accounts[1]});

            console.log('Actual identity creation gas cost:', actualGas);
            assert.isBelow(actualGas, maxGas, `Gas Price for identity creation is to high`)
        })

    });

    describe("Check gas for adding keys", async function () {

        const maxAddMutipleGas = 250000;
        it(` Gas cost for adding a key with 3 purposes should be less then ${maxAddMutipleGas} `, async function () {
            const {key} = await getBasicTestNeeds(accounts);
            const addMultiPurposeKeyGas = await this.identity.addMultiPurposeKey.estimateGas(key, [P2P_IDENTITY, P2P_SIGNATURE], 1);

            console.log('Actual addMultiPurposeKey gas cost:', addMultiPurposeKeyGas);
            assert.isBelow(addMultiPurposeKeyGas, maxAddMutipleGas, `Gas Price for addMultiPurposeKey is to high`)
        });

        const maxAddGas = 140000;
        it(` Gas cost for adding a key with one purpose should be less then ${maxAddGas} `, async function () {
            const {key} = await getBasicTestNeeds(accounts);
            const addKeyGas = await this.identity.addKey.estimateGas(key, P2P_IDENTITY, 1);

            console.log('Actual AddKey gas cost:', addKeyGas);
            assert.isBelow(addKeyGas, maxAddGas, `Gas Price for addKey is to high`)
        });

        const maxRevokeGas = 50000;
        it(` Gas cost for revoking a key should be less then ${maxRevokeGas} `, async function () {
            const {key} = await getBasicTestNeeds(accounts);
            await this.identity.addMultiPurposeKey(key, [P2P_IDENTITY], 1);
            const revokeKeyGas = await this.identity.revokeKey.estimateGas(key);

            console.log('Actual revokeKey gas cost:', revokeKeyGas);
            assert.isBelow(revokeKeyGas, maxRevokeGas, `Gas Price for revoke is to high`)
        })
    });

    describe("check the gas cost for mint", async function () {
        const mintMaxGas = 833819;
        it(`should have mint gas cost less then ${mintMaxGas} `, async function () {

            await this.anchorRepository.commit(
                docIdPreImage,
                validRootHash,
                []
            );
            await this.poRegistry.setOwnAddress(contractAddress);
            await this.poRegistry.setSender(sender.value);
            await this.poRegistry.setIdentity(this.identity.address);
            await this.identityFactory.registerIdentity(sender.value);


            const mintGasCost = await this.poRegistry.mint.estimateGas(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                poMintParams.properties,
                poMintParams.values,
                poMintParams.salts,
                poMintParams.proofs
            );
            console.log('Actual mint gas cost:', mintGasCost);
            assert.isBelow(mintGasCost, mintMaxGas, `Gas Price for mint is to high`)
        })
    });

    describe("check the gas cost for mint with the identity proxy for ACTION key", async function () {
        const mintMaxGas = 833819;
        it(`should have mint gas cost less then ${mintMaxGas} `, async function () {
            await this.anchorRepository.commit(
                docIdPreImage,
                validRootHash,
                []
            );

            await this.poRegistry.setOwnAddress(contractAddress);
            await this.poRegistry.setSender(sender.value);
            await this.poRegistry.setIdentity(this.identity.address);
            await this.identityFactory.registerIdentity(sender.value);

            const data = await this.poRegistry.contract.methods.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                poMintParams.properties,
                poMintParams.values,
                poMintParams.salts,
                poMintParams.proofs
            ).encodeABI();

            const mintGasCost = await this.identity.execute.estimateGas(this.poRegistry.address, 0, data, {from: accounts[1]});
            console.log('Actual mint gas cost:', mintGasCost);
            assert.isBelow(mintGasCost, mintMaxGas, `Gas Price for mint is to high`)
        })
    });
});

