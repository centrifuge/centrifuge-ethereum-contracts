const shouldRevert = require('../tools/assertTx').shouldRevert
let MockPaymentObligation = artifacts.require("MockPaymentObligation");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let proof = require('./proof.json');

contract("PaymentObligation", function (accounts) {


    let nextVersion = proof.field_proofs[5];
    let nftUnique = proof.field_proofs[4];
    let documentIdentifier = proof.header.version_id;
    let nextDocumentIdentifier = nextVersion.value;
    let validRootHash = proof.header.document_root;
    let tokenURI = "http://test.com";
    let tokenId = nftUnique.value;

    beforeEach(async function () {
        this.anchorRegistry = await MockAnchorRegistry.new();
        this.registry = await MockPaymentObligation.new();
        await this.registry.initialize(this.anchorRegistry.address)
    });

    describe("mint", async function () {

        it('should work', async function() {
            const tokenURI = "http://test.com";
            const tokenId = 1;

            console.log( await this.registry.testBytes());

        })




       it("should mint a token if the Merkle proofs validates", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

           await this.registry.setOwnAddress("0x910e4e12FC1f0fFBA5D9Bf79ad5760155d3f62C8");

            await this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                nextDocumentIdentifier,
                [
                    proof.field_proofs[0].value,
                    proof.field_proofs[1].value,
                    proof.field_proofs[2].value,
                    proof.field_proofs[3].value,
                ],
                [
                    proof.field_proofs[0].salt,
                    proof.field_proofs[1].salt,
                    proof.field_proofs[2].salt,
                    proof.field_proofs[3].salt,
                    nftUnique.salt,
                    nextVersion.salt,

                ],
                [
                    proof.field_proofs[0].sorted_hashes,
                    proof.field_proofs[1].sorted_hashes,
                    proof.field_proofs[2].sorted_hashes,
                    proof.field_proofs[3].sorted_hashes,
                    nftUnique.sorted_hashes,
                    nextVersion.sorted_hashes,
                ]
            )
                .then(function (tx, logs) {
                    // Check mint event
                    const event = tx.logs[1].args;
                    assert.equal(event.to.toLowerCase(), accounts[2].toLowerCase());
                    assert.equal(web3.utils.toHex(event.tokenId), tokenId);
                    assert.equal(event.tokenURI, tokenURI);
                });

            // check token details
            let tokenDetails = await this.registry.getTokenDetails(tokenId);

            assert.equal(tokenDetails[0], proof.field_proofs[0].value)
            assert.equal(tokenDetails[1], proof.field_proofs[1].value)
            assert.equal(tokenDetails[2], proof.field_proofs[2].value)
            assert.equal(web3.utils.toHex(tokenDetails[3]), documentIdentifier)
            assert.equal(tokenDetails[4], validRootHash);

            //check token uri
            let tokenUri = await this.registry.tokenURI(tokenId);
            assert.equal(tokenUri, tokenURI)
        });

        /*it("should not mint a token if the a Merkle proof fails", async function () {
            const documentIdentifier = proof.header.version_id;
            const validRootHash = proof.header.document_root;
            const tokenURI = "http://test.com";
            const tokenId = 1;

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await shouldRevert(this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                [
                    'Some Random Value',
                    proof.field_proofs[1].value,
                    proof.field_proofs[2].value,
                    proof.field_proofs[3].value,
                    proof.field_proofs[3].value,
                    proof.field_proofs[5].value,
                ],
                [
                    proof.field_proofs[0].salt,
                    proof.field_proofs[1].salt,
                    proof.field_proofs[2].salt,
                    proof.field_proofs[3].salt,
                    proof.field_proofs[3].salt,
                    proof.field_proofs[5].salt,

                ],
                [
                    proof.field_proofs[0].sorted_hashes,
                    proof.field_proofs[1].sorted_hashes,
                    proof.field_proofs[2].sorted_hashes,
                    proof.field_proofs[3].sorted_hashes,
                    proof.field_proofs[3].sorted_hashes,
                    proof.field_proofs[5].sorted_hashes,
                ]
            ));
        });

        it("should not mint a token if the anchorId has been used before", async function () {
            let documentIdentifier = proof.header.version_id;
            let validRootHash = proof.header.document_root;
            let tokenURI = "http://test.com";

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );
            const tokenId = 1;

            await this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                [
                    proof.field_proofs[0].value,
                    proof.field_proofs[1].value,
                    proof.field_proofs[2].value,
                    proof.field_proofs[3].value,
                    proof.field_proofs[3].value,
                    proof.field_proofs[5].value,
                ],
                [
                    proof.field_proofs[0].salt,
                    proof.field_proofs[1].salt,
                    proof.field_proofs[2].salt,
                    proof.field_proofs[3].salt,
                    proof.field_proofs[3].salt,
                    proof.field_proofs[5].salt,

                ],
                [
                    proof.field_proofs[0].sorted_hashes,
                    proof.field_proofs[1].sorted_hashes,
                    proof.field_proofs[2].sorted_hashes,
                    proof.field_proofs[3].sorted_hashes,
                    proof.field_proofs[3].sorted_hashes,
                    proof.field_proofs[5].sorted_hashes,
                ]
            );

            await shouldRevert(
                this.registry.mint(
                    accounts[2],
                    tokenId,
                    tokenURI,
                    documentIdentifier,
                    [
                        proof.field_proofs[0].value,
                        proof.field_proofs[1].value,
                        proof.field_proofs[2].value,
                        proof.field_proofs[3].value,
                        //proof.field_proofs[3].value,
                        proof.field_proofs[5].value,
                    ],
                    [
                        proof.field_proofs[0].salt,
                        proof.field_proofs[1].salt,
                        proof.field_proofs[2].salt,
                        proof.field_proofs[3].salt,
                        //proof.field_proofs[3].salt,
                        proof.field_proofs[5].salt,

                    ],
                    [
                        proof.field_proofs[0].sorted_hashes,
                        proof.field_proofs[1].sorted_hashes,
                        proof.field_proofs[2].sorted_hashes,
                        proof.field_proofs[3].sorted_hashes,
                        //proof.field_proofs[3].sorted_hashes,
                        proof.field_proofs[5].sorted_hashes,
                    ]
                )
            );
        });*/
    });


});
