const shouldRevert = require('../tools/assertTx').shouldRevert
let MockPaymentObligation = artifacts.require("MockPaymentObligation");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let MockIdentityFactory = artifacts.require("MockIdentityFactory");
let proof = require("./proof.js");

contract("PaymentObligation", function (accounts) {


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
    } = proof;

    let nextDocumentIdentifier = nextVersion.value;

    describe("mint", async function () {

        beforeEach(async function () {
            this.anchorRegistry = await MockAnchorRegistry.new();
            this.identityFactory = await MockIdentityFactory.new();
            this.registry = await MockPaymentObligation.new(this.anchorRegistry.address,this.identityFactory.address);
        });

        it("should mint a token if the Merkle proofs validates", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );
            await this.identityFactory.registerIdentity(sender.value);
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
                    sender.value,
                    readRole.value,
                ],
                [
                    grossAmount.salt,
                    currency.salt,
                    due_date.salt,
                    sender.salt,
                    status.salt,
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
                    sender.sorted_hashes,
                    status.sorted_hashes,
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

            assert.equal(tokenDetails[0], grossAmount.value)
            assert.equal(tokenDetails[1], currency.value)
            assert.equal(tokenDetails[2], due_date.value)
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
            await this.identityFactory.registerIdentity(sender.value);

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
                    sender.value,
                    readRole.value,
                ],
                [
                    grossAmount.salt,
                    currency.salt,
                    due_date.salt,
                    sender.salt,
                    status.salt,
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
                    sender.sorted_hashes,
                    status.sorted_hashes,
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

            await this.identityFactory.registerIdentity(sender.value);

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
                    sender.value,
                    readRole.value,
                ],
                [
                    grossAmount.salt,
                    currency.salt,
                    due_date.salt,
                    sender.salt,
                    status.salt,
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
                    sender.sorted_hashes,
                    status.sorted_hashes,
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
                        sender.value,
                        readRole.value,
                    ],
                    [
                        grossAmount.salt,
                        currency.salt,
                        due_date.salt,
                        sender.salt,
                        status.salt,
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
                        sender.sorted_hashes,
                        status.sorted_hashes,
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


        it("should fail if the status proof does not pass", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await this.identityFactory.registerIdentity(sender.value);

            await this.registry.setOwnAddress(contractAddress);


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
                        sender.value,
                        readRole.value,
                    ],
                    [
                        grossAmount.salt,
                        currency.salt,
                        due_date.salt,
                        sender.salt,
                        nextVersion.salt, // replace status.salt with nextVersion
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
                        sender.sorted_hashes,
                        status.sorted_hashes,
                        nextVersion.sorted_hashes,
                        nftUnique.sorted_hashes,
                        readRole.sorted_hashes,
                        readRoleAction.sorted_hashes,
                        tokenRole.sorted_hashes,
                    ]
                ),
                "Invoice status is not unpaid"
            );
        });
    });


});
