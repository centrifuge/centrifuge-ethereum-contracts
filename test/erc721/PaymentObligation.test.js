import {shouldRevert} from "../tools/assertTx";

let PaymentObligation = artifacts.require("PaymentObligation");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let IdentityRegistry = artifacts.require("IdentityRegistry");
let Identity = artifacts.require("Identity");
let proof = require('./proof.json');

let deployedCentrifugeId = "0x24fe6555beb9";
let deployedIdentity;
let deployedIdentityRegistry;

contract("PaymentObligation", function (accounts) {
    before(async function () {
        deployedIdentityRegistry = await IdentityRegistry.deployed();
        deployedIdentity = await Identity.new(deployedCentrifugeId);
        await deployedIdentityRegistry.registerIdentity(deployedCentrifugeId, deployedIdentity.address);
    });

    beforeEach(async function () {
        this.anchorRegistry = await MockAnchorRegistry.new();
        this.registry = await PaymentObligation.new(
            this.anchorRegistry.address,
            deployedIdentityRegistry.address
        );
    });

    describe("mint", async function () {


        it("should mint a token if the Merkle proofs validates", async function () {
            let documentIdentifer = proof.header.version_id;
            let validRootHash = proof.header.document_root;
            let tokenURI = "http://test.com";
           let signature = "0x1";

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );
            const tokenId = 1;
            await this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifer,
                validRootHash,
                [
                    proof.field_proofs[0].value,
                    proof.field_proofs[1].value,
                    proof.field_proofs[2].value,
                    proof.field_proofs[3].value,
                    proof.field_proofs[4].value,
                ],
                [
                    proof.field_proofs[0].salt,
                    proof.field_proofs[1].salt,
                    proof.field_proofs[2].salt,
                    proof.field_proofs[3].salt,
                    proof.field_proofs[4].salt,

                ],
                [
                    proof.field_proofs[0].sorted_hashes,
                    proof.field_proofs[1].sorted_hashes,
                    proof.field_proofs[2].sorted_hashes,
                    proof.field_proofs[3].sorted_hashes,
                    proof.field_proofs[4].sorted_hashes,
                ],
                signature
            )
                .then(function (tx, logs) {
                    // Check mint event
                    const event = tx.logs[1].args;
                    assert.equal(event.to.toLowerCase(), accounts[2].toLowerCase());
                    assert.equal(event.tokenId, tokenId);
                    assert.equal(event.tokenURI, tokenURI);
                });

            // check token details
            let tokenDetails = await this.registry.getTokenDetails(tokenId);

            assert.equal(tokenDetails[0], proof.field_proofs[0].value)
            assert.equal(tokenDetails[1], proof.field_proofs[1].value)
            assert.equal(tokenDetails[2], proof.field_proofs[2].value)
            assert.equal(web3.utils.toHex(tokenDetails[3]), documentIdentifer)
            assert.equal(tokenDetails[4], validRootHash);

            //check token uri
            let tokenUri = await this.registry.tokenURI(tokenId);
            assert.equal(tokenUri, tokenURI)
        });

        it("should not mint a token if the a Merkle proof fails", async function () {
            let documentIdentifer = proof.header.version_id;
            let validRootHash = proof.header.document_root;
            let tokenURI = "http://test.com";
           let signature = "0x1";
            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );
            const tokenId = 1;

            await shouldRevert(this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifer,
                validRootHash,
                [
                    'Some Random Value',
                    proof.field_proofs[1].value,
                    proof.field_proofs[2].value,
                    proof.field_proofs[3].value,
                    proof.field_proofs[4].value,
                ],
                [
                    proof.field_proofs[0].salt,
                    proof.field_proofs[1].salt,
                    proof.field_proofs[2].salt,
                    proof.field_proofs[3].salt,
                    proof.field_proofs[4].salt,

                ],
                [
                    proof.field_proofs[0].sorted_hashes,
                    proof.field_proofs[1].sorted_hashes,
                    proof.field_proofs[2].sorted_hashes,
                    proof.field_proofs[3].sorted_hashes,
                    proof.field_proofs[4].sorted_hashes,
                ],
                signature
            ));
        });

        it("should not mint a token if the anchorId has been used before", async function () {
            let documentIdentifer = proof.header.version_id;
            let validRootHash = proof.header.document_root;
            let tokenURI = "http://test.com";
            let signature = "0x1";

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );
            const tokenId = 1;

            this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifer,
                validRootHash,
                [
                    proof.field_proofs[0].value,
                    proof.field_proofs[1].value,
                    proof.field_proofs[2].value,
                    proof.field_proofs[3].value,
                    proof.field_proofs[4].value,
                ],
                [
                    proof.field_proofs[0].salt,
                    proof.field_proofs[1].salt,
                    proof.field_proofs[2].salt,
                    proof.field_proofs[3].salt,
                    proof.field_proofs[4].salt,

                ],
                [
                    proof.field_proofs[0].sorted_hashes,
                    proof.field_proofs[1].sorted_hashes,
                    proof.field_proofs[2].sorted_hashes,
                    proof.field_proofs[3].sorted_hashes,
                    proof.field_proofs[4].sorted_hashes,
                ],
                signature
            );

            await shouldRevert(this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifer,
                validRootHash,
                [
                    proof.field_proofs[0].value,
                    proof.field_proofs[1].value,
                    proof.field_proofs[2].value,
                    proof.field_proofs[3].value,
                    proof.field_proofs[4].value,
                ],
                [
                    proof.field_proofs[0].salt,
                    proof.field_proofs[1].salt,
                    proof.field_proofs[2].salt,
                    proof.field_proofs[3].salt,
                    proof.field_proofs[4].salt,

                ],
                [
                    proof.field_proofs[0].sorted_hashes,
                    proof.field_proofs[1].sorted_hashes,
                    proof.field_proofs[2].sorted_hashes,
                    proof.field_proofs[3].sorted_hashes,
                    proof.field_proofs[4].sorted_hashes,
                ],
                signature
            ));
        });
    });

    describe("check the gas cost for mint", async function () {
        const mintMaxGas = 533819;
        it(`should have mint gas cost less then ${mintMaxGas} `, async function () {
            let documentIdentifer = proof.header.version_id;
            let validRootHash = proof.header.document_root;
            let tokenURI = "http://test.com";
            let signature = "0x1";

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );
            const tokenId = 1;

            const mintGasCost = await this.registry.mint.estimateGas(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifer,
                validRootHash,
                [
                    proof.field_proofs[0].value,
                    proof.field_proofs[1].value,
                    proof.field_proofs[2].value,
                    proof.field_proofs[3].value,
                    proof.field_proofs[4].value,
                ],
                [
                    proof.field_proofs[0].salt,
                    proof.field_proofs[1].salt,
                    proof.field_proofs[2].salt,
                    proof.field_proofs[3].salt,
                    proof.field_proofs[4].salt,

                ],
                [
                    proof.field_proofs[0].sorted_hashes,
                    proof.field_proofs[1].sorted_hashes,
                    proof.field_proofs[2].sorted_hashes,
                    proof.field_proofs[3].sorted_hashes,
                    proof.field_proofs[4].sorted_hashes,
                ],
                signature
            );
            console.log('Actual mint gas cost:', mintGasCost)
            assert.isBelow(mintGasCost, mintMaxGas, `Gas Price for mint is to high`)
        })
    });
});
