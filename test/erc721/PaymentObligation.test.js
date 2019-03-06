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
        poMintPrams
    } = proof;


    describe("mint", async function () {

        beforeEach(async function () {
            this.anchorRegistry = await MockAnchorRegistry.new();
            this.identityFactory = await MockIdentityFactory.new();
            this.registry = await MockPaymentObligation.new(this.anchorRegistry.address, this.identityFactory.address);
        });

        it("should mint a token if the Merkle poMintPrams.proofs validates", async function () {

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
                poMintPrams.properties,
                poMintPrams.values,
                poMintPrams.salts,
                poMintPrams.proofs
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
                poMintPrams.properties,
                [...poMintPrams.values].reverse(),
                poMintPrams.salts,
                poMintPrams.proofs
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
                poMintPrams.properties,
                poMintPrams.values,
                poMintPrams.salts,
                poMintPrams.proofs
            );

            await shouldRevert(
                this.registry.mint(
                    accounts[2],
                    tokenId,
                    tokenURI,
                    documentIdentifier,
                    poMintPrams.properties,
                    poMintPrams.values,
                    poMintPrams.salts,
                    poMintPrams.proofs
                ),
                "Token exists"
            );
        });


        it("should fail if the status proof does not pass", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );


            let replacedStatus = [...poMintPrams.salts];
            replacedStatus.splice(4,1,nextVersion.salt);// replace status salt with next version


            await this.identityFactory.registerIdentity(sender.value);

            await this.registry.setOwnAddress(contractAddress);


            await shouldRevert(
                this.registry.mint(
                    accounts[2],
                    tokenId,
                    tokenURI,
                    documentIdentifier,
                    poMintPrams.properties,
                    poMintPrams.values,
                    replacedStatus,
                    poMintPrams.proofs
                ),
                "Invoice status is not unpaid"
            );
        });
    });


});
