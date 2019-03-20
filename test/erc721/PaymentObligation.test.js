const {getEventValue} = require("../tools/contractEvents");
const shouldRevert = require('../tools/assertTx').shouldRevert;
const {P2P_IDENTITY, P2P_SIGNATURE, ACTION} = require('../constants');
const MockPaymentObligation = artifacts.require("MockPaymentObligation");
const MockAnchorRegistry = artifacts.require("MockAnchorRepository");
const MockIdentityFactory = artifacts.require("MockIdentityFactory");
const Identity = artifacts.require("Identity");
const proof = require("./proof.js");

contract("PaymentObligation", function (accounts) {


    let {
        grossAmount,
        currency,
        due_date,
        sender,
        nextVersion,
        publicKey,
        tokenId,
        documentIdentifier,
        validRootHash,
        contractAddress,
        tokenURI,
        poMintParams
    } = proof;


    describe("mint", async function () {

        beforeEach(async function () {
            this.anchorRegistry = await MockAnchorRegistry.new();
            this.identityFactory = await MockIdentityFactory.new();
            this.identity = await Identity.new(accounts[2], [publicKey], [P2P_SIGNATURE]);
            this.registry = await MockPaymentObligation.new(this.anchorRegistry.address, this.identityFactory.address);
        });

        it("should mint a token if the Merkle poMintParams.proofs validates", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await this.identityFactory.registerIdentity(sender.value);

            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setSender(sender.value);
            await this.registry.setIdentity(this.identity.address);

            await this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                poMintParams.properties,
                poMintParams.values,
                poMintParams.salts,
                poMintParams.proofs
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

            assert.equal(tokenDetails[0].toLowerCase(), sender.toLowerCase())
            assert.equal(tokenDetails[1], grossAmount.value)
            assert.equal(tokenDetails[2], currency.value)
            assert.equal(tokenDetails[3], due_date.value)
            assert.equal(web3.utils.toHex(tokenDetails[4]), documentIdentifier)
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
                poMintParams.properties,
                [...poMintParams.values].reverse(),
                poMintParams.salts,
                poMintParams.proofs
            ));
        });

        it("should fail if the anchored is signed with a revoked key", async function () {


            let identity = await Identity.new(accounts[0], [publicKey], [P2P_SIGNATURE]);
            await identity.revokeKey(publicKey);

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await this.identityFactory.registerIdentity(sender.value);

            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setSender(sender.value);
            await this.registry.setIdentity(identity.address);

            await shouldRevert(
                this.registry.mint(
                    accounts[2],
                    tokenId,
                    tokenURI,
                    documentIdentifier,
                    poMintParams.properties,
                    poMintParams.values,
                    poMintParams.salts,
                    poMintParams.proofs
                ),
                "Document signed with a revoked key");
        });

        it("should fail if the identity key check fails", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await this.identityFactory.registerIdentity(sender.value);

            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setSender(sender.value);

            await shouldRevert(this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                poMintParams.properties,
                poMintParams.values,
                poMintParams.salts,
                poMintParams.proofs
            ));
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
                poMintParams.properties,
                [...poMintParams.values].reverse(),
                poMintParams.salts,
                poMintParams.proofs
            ));
        });

        it("should fail if the token exists", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await this.identityFactory.registerIdentity(sender.value);

            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setSender(sender.value);
            await this.registry.setIdentity(this.identity.address);

            await this.registry.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifier,
                poMintParams.properties,
                poMintParams.values,
                poMintParams.salts,
                poMintParams.proofs
            );

            await shouldRevert(
                this.registry.mint(
                    accounts[2],
                    tokenId,
                    tokenURI,
                    documentIdentifier,
                    poMintParams.properties,
                    poMintParams.values,
                    poMintParams.salts,
                    poMintParams.proofs
                ),
                "Token exists"
            );
        });


        it("should fail if the status proof does not pass", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );


            let replacedStatus = [...poMintParams.salts];
            replacedStatus.splice(4, 1, nextVersion.salt);// replace status salt with next version


            await this.identityFactory.registerIdentity(sender.value);

            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setSender(sender.value);
            await this.registry.setIdentity(this.identity.address);

            await shouldRevert(
                this.registry.mint(
                    accounts[2],
                    tokenId,
                    tokenURI,
                    documentIdentifier,
                    poMintParams.properties,
                    poMintParams.values,
                    replacedStatus,
                    poMintParams.proofs
                ),
                "Invoice status is not unpaid"
            );
        });
    });


});
