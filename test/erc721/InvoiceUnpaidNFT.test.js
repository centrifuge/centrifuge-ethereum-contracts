const {getEventValue} = require("../tools/contractEvents");
const shouldRevert = require('../tools/assertTx').shouldRevert;
const {P2P_IDENTITY, P2P_SIGNATURE, ACTION} = require('../constants');
const MockInvoiceUnpaidNFT = artifacts.require("MockInvoiceUnpaidNFT");
const MockAnchorRegistry = artifacts.require("MockAnchorRepository");
const MockIdentityFactory = artifacts.require("MockIdentityFactory");
const Identity = artifacts.require("Identity");
const proof = require("./proof.js");

contract("InvoiceUnpaidNFT", function (accounts) {


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
        unpaidInvoiceMintParams
    } = proof;



    describe("isTokenLatestDocument", async function () {
        beforeEach(async function () {

            this.anchorRegistry = await MockAnchorRegistry.new();
            this.identityFactory = await MockIdentityFactory.new();
            this.identity = await Identity.new(accounts[2], [publicKey], [P2P_SIGNATURE]);
            this.registry = await MockInvoiceUnpaidNFT.new(this.anchorRegistry.address, this.identityFactory.address);

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
                unpaidInvoiceMintParams.properties,
                unpaidInvoiceMintParams.values,
                unpaidInvoiceMintParams.salts,
                unpaidInvoiceMintParams.proofs
            )
                .then(function (tx, logs) {
                    // Check mint event
                    const event = tx.logs[1].args;
                    assert.equal(event.to.toLowerCase(), accounts[2].toLowerCase());
                    assert.equal(web3.utils.toHex(event.tokenId), tokenId);
                    assert.equal(event.tokenURI, tokenURI);
                });
        });

        it("Token should have the latest document version", async function() {
            let isTokenLatestDocument = await this.registry.isTokenLatestDocument(tokenId);
            assert.equal(isTokenLatestDocument,true);
        })

        it("Token should have not the latest document version", async function() {
            await this.anchorRegistry.setAnchorById(
                nextVersion.value,
                validRootHash
            );
            let isTokenLatestDocument = await this.registry.isTokenLatestDocument(tokenId);

            let tokenDetails = await this.registry.getTokenDetails(tokenId);
            assert.equal(isTokenLatestDocument,false);
        })

        it("Should return false if the token does not exist", async function() {
            let isTokenLatestDocument = await this.registry.isTokenLatestDocument(documentIdentifier);
            assert.equal(isTokenLatestDocument,false);
        })


    });

    describe("mint", async function () {

        beforeEach(async function () {
            this.anchorRegistry = await MockAnchorRegistry.new();
            this.identityFactory = await MockIdentityFactory.new();
            this.identity = await Identity.new(accounts[2], [publicKey], [P2P_SIGNATURE]);
            this.registry = await MockInvoiceUnpaidNFT.new(this.anchorRegistry.address, this.identityFactory.address);
        });

        it("should mint a token if the Merkle unpaidInvoiceMintParams.proofs validates", async function () {

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
                unpaidInvoiceMintParams.properties,
                unpaidInvoiceMintParams.values,
                unpaidInvoiceMintParams.salts,
                unpaidInvoiceMintParams.proofs
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

            //assert.equal(tokenDetails[0].toLowerCase(), sender.value.toLowerCase())
            assert.equal(tokenDetails[1], grossAmount.value)
            assert.equal(tokenDetails[2], currency.value)
            assert.equal(tokenDetails[3], due_date.value)
            assert.equal(web3.utils.toHex(tokenDetails[4]), documentIdentifier)
            assert.equal(web3.utils.toHex(tokenDetails[5]), nextVersion.value)
            assert.equal(tokenDetails[6], validRootHash);

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
                unpaidInvoiceMintParams.properties,
                [...unpaidInvoiceMintParams.values].reverse(),
                unpaidInvoiceMintParams.salts,
                unpaidInvoiceMintParams.proofs
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
                    unpaidInvoiceMintParams.properties,
                    unpaidInvoiceMintParams.values,
                    unpaidInvoiceMintParams.salts,
                    unpaidInvoiceMintParams.proofs
                ),
                "Document signed with a revoked key"
            );
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
                unpaidInvoiceMintParams.properties,
                unpaidInvoiceMintParams.values,
                unpaidInvoiceMintParams.salts,
                unpaidInvoiceMintParams.proofs
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
                unpaidInvoiceMintParams.properties,
                [...unpaidInvoiceMintParams.values].reverse(),
                unpaidInvoiceMintParams.salts,
                unpaidInvoiceMintParams.proofs
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
                unpaidInvoiceMintParams.properties,
                unpaidInvoiceMintParams.values,
                unpaidInvoiceMintParams.salts,
                unpaidInvoiceMintParams.proofs
            );

            await shouldRevert(
                this.registry.mint(
                    accounts[2],
                    tokenId,
                    tokenURI,
                    documentIdentifier,
                    unpaidInvoiceMintParams.properties,
                    unpaidInvoiceMintParams.values,
                    unpaidInvoiceMintParams.salts,
                    unpaidInvoiceMintParams.proofs
                ),
                "Token exists"
            );
        });


        it("should fail if the status proof does not pass", async function () {

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );


            let replacedStatus = [...unpaidInvoiceMintParams.salts];
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
                    unpaidInvoiceMintParams.properties,
                    unpaidInvoiceMintParams.values,
                    replacedStatus,
                    unpaidInvoiceMintParams.proofs
                ),
                "Invoice status is not unpaid"
            );
        });
    });


});
