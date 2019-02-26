const shouldRevert = require('../tools/assertTx').shouldRevert
let MockPaymentObligation = artifacts.require("MockPaymentObligation");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let proof = require('./proof.json');

contract("PaymentObligation", function (accounts) {


    let grossAmount = proof.field_proofs[0];
    let currency = proof.field_proofs[1];
    let due_date = proof.field_proofs[2];
    let nextVersion = proof.field_proofs[3];
    let nftUnique = proof.field_proofs[4];
    let readRole = proof.field_proofs[5];
    let tokenRole = proof.field_proofs[6];
    let readRoleAction = proof.field_proofs[7];

    let tokenId = nftUnique.value;
    let documentIdentifier = proof.header.version_id;
    let nextDocumentIdentifier = nextVersion.value;
    let validRootHash = proof.header.document_root;
    let contractAddress = "0x72a4a87df477d4ef205c4b5f8ded88d8650d43a4";

    let tokenURI = "http://test.com"

    beforeEach(async function () {
        this.anchorRegistry = await MockAnchorRegistry.new();
        this.registry = await MockPaymentObligation.new();
        await this.registry.initialize(this.anchorRegistry.address)
    });

    describe("mint", async function () {

        it("should mint a token if the Merkle proofs validates", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await this.registry.setOwnAddress(contractAddress);

            await this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                nextDocumentIdentifier,
                [
                    readRole.property,
                    tokenRole.property
                ],
                [
                    grossAmount.value,
                    currency.value,
                    due_date.value,
                    readRole.value,
                ],
                [
                    grossAmount.salt,
                    currency.salt,
                    due_date.salt,
                    nextVersion.salt,
                    nftUnique.salt,
                    readRole.salt,
                    readRoleAction.salt,
                    tokenRole.salt,

                ],
                [
                    grossAmount.sorted_hashes,
                    currency.sorted_hashes,
                    due_date.sorted_hashes,
                    nextVersion.sorted_hashes,
                    nftUnique.sorted_hashes,
                    readRole.sorted_hashes,
                    readRoleAction.sorted_hashes,
                    tokenRole.sorted_hashes,
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

        it("should not mint a token if the a Merkle proof fails", async function () {
            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await shouldRevert(this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                nextDocumentIdentifier,
                [
                    readRole.property,
                    tokenRole.property
                ],
                [
                    "0x1",
                    currency.value,
                    due_date.value,
                    readRole.value,
                ],
                [
                    grossAmount.salt,
                    currency.salt,
                    due_date.salt,
                    nextVersion.salt,
                    nftUnique.salt,
                    readRole.salt,
                    readRoleAction.salt,
                    tokenRole.salt,

                ],
                [
                    grossAmount.sorted_hashes,
                    currency.sorted_hashes,
                    due_date.sorted_hashes,
                    nextVersion.sorted_hashes,
                    nftUnique.sorted_hashes,
                    readRole.sorted_hashes,
                    readRoleAction.sorted_hashes,
                    tokenRole.sorted_hashes,
                ]
            ));
        });

        it("should fail if the token exists", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await this.registry.setOwnAddress(contractAddress);

            await this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                nextDocumentIdentifier,
                [
                    readRole.property,
                    tokenRole.property
                ],
                [
                    grossAmount.value,
                    currency.value,
                    due_date.value,
                    readRole.value,
                ],
                [
                    grossAmount.salt,
                    currency.salt,
                    due_date.salt,
                    nextVersion.salt,
                    nftUnique.salt,
                    readRole.salt,
                    readRoleAction.salt,
                    tokenRole.salt,

                ],
                [
                    grossAmount.sorted_hashes,
                    currency.sorted_hashes,
                    due_date.sorted_hashes,
                    nextVersion.sorted_hashes,
                    nftUnique.sorted_hashes,
                    readRole.sorted_hashes,
                    readRoleAction.sorted_hashes,
                    tokenRole.sorted_hashes,
                ]
            );

            await shouldRevert(
                this.registry.mint(
                    accounts[2],
                    tokenId,
                    tokenURI,
                    documentIdentifier,
                    nextDocumentIdentifier,
                    [
                        readRole.property,
                        tokenRole.property
                    ],
                    [
                        grossAmount.value,
                        currency.value,
                        due_date.value,
                        readRole.value,
                    ],
                    [
                        grossAmount.salt,
                        currency.salt,
                        due_date.salt,
                        nextVersion.salt,
                        nftUnique.salt,
                        readRole.salt,
                        readRoleAction.salt,
                        tokenRole.salt,

                    ],
                    [
                        grossAmount.sorted_hashes,
                        currency.sorted_hashes,
                        due_date.sorted_hashes,
                        nextVersion.sorted_hashes,
                        nftUnique.sorted_hashes,
                        readRole.sorted_hashes,
                        readRoleAction.sorted_hashes,
                        tokenRole.sorted_hashes,
                    ]
                ),
                "Token exists"
            );
        });
    });


});
