const shouldRevert = require('../tools/assertTx').shouldRevert;
const MockAnchorRegistry = artifacts.require("MockAnchorRepository");
const MockIdentityFactory = artifacts.require("MockIdentityFactory");
const MockUserMintableERC721 = artifacts.require("MockUserMintableERC721");
const Identity = artifacts.require("Identity");
const proof = require("./proof.js");
const {P2P_IDENTITY, P2P_SIGNATURE, ACTION} = require('../constants');



contract("UserMintableERC721", function (accounts) {

    let {
        grossAmount,
        currency,
        sender,
        docDataRoot,
        signature,
        nextVersion,
        nftUnique,
        readRole,
        readRoleAction,
        tokenRole,
        tokenId,
        documentIdentifier,
        validRootHash,
        contractAddress,
        readRuleIndex,
        publicKey
    } = proof;

    const mandatoryFields = [grossAmount.property, currency.property];
    const tokenUriBase = "http://metadata.com/";


    beforeEach(async function () {
        this.anchorRegistry = await MockAnchorRegistry.new();
        this.identityFactory = await MockIdentityFactory.new();
        this.identity  = await Identity.new(accounts[2],[publicKey],[P2P_SIGNATURE]);
        this.registry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", tokenUriBase, this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);
    });

    describe("UserMintableERC721 Deployment", async function () {

        it("should be deployable as an independent registry", async function () {
            let anchorRegistry = await MockAnchorRegistry.new();
            let identityFactory = await MockIdentityFactory.new();
            let instance = await MockUserMintableERC721.new("ERC721 Document Anchor 2", "TDA2",  tokenUriBase, anchorRegistry.address, identityFactory.address, mandatoryFields);

            assert.equal("ERC721 Document Anchor 2", await instance.name.call(), "The registry should be deployed with the specific name");
            assert.equal("TDA2", await instance.symbol.call(), "The registry should be deployed with the specific symbol");
            assert.equal(anchorRegistry.address, await instance.getAnchorRegistry(), "The registry should be deployed with the specific anchor registry");
            assert.equal(identityFactory.address, await instance.getIdentityFactory(), "The registry should be deployed with the specific identity factory");
        });

        // TODO Should we check the interface of the anchorRegistry?
        // it("should fail to deploy with an invalid anchor registry", async function () {
        //     await shouldRevert(UserMintableERC721.new("ERC721 Document Anchor", "TDA", "0x1"));
        // });
    });


    describe("_getDocumentRoot", async function () {

        it("Should return the correct anchored document root", async function () {
            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            const anchoredRoot = await this.registry.getDocumentRoot(
                documentIdentifier
            )

            assert.equal(
                anchoredRoot[0],
                validRootHash
            );
        })

        it("Should fail if the document anchor is not in the registry", async function () {
           await shouldRevert(
                this.registry.getDocumentRoot(
                    documentIdentifier
                ),
                "Document in not anchored in the registry"
            );
        })


    });


    describe("_requireIsLatestDocumentVersion", async function () {

        it("Should validate that the document version is the latest ", async function () {
            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await this.registry.requireIsLatestDocumentVersion(
                validRootHash,
                nextVersion.value,
                nextVersion.salt,
                nextVersion.sorted_hashes
            );
        })

        it("Should fail when there is a newer version of the document ", async function () {
            //anchor next identifier
            await this.anchorRegistry.setAnchorById(
                nextVersion.value,
                validRootHash
            );


            await shouldRevert(
                this.registry.requireIsLatestDocumentVersion(
                    validRootHash,
                    nextVersion.value,
                    nextVersion.salt,
                    nextVersion.sorted_hashes
                ),
                "Document has a newer version on chain"
            )


        })

        it("Should fail if the next version proof is not valid", async function () {
            await shouldRevert(
                this.registry.requireIsLatestDocumentVersion(
                    validRootHash,
                    documentIdentifier,
                    nextVersion.salt,
                    nextVersion.sorted_hashes
                ),
                "Next version proof is not valid"
            );
        })


    });


    describe("_requireValidIdentity", async function () {

        it("Should fail if the identity is not registered", async function () {

            await shouldRevert(this.registry.requireValidIdentity(
                validRootHash,
                sender.property,
                sender.value,
                sender.salt,
                sender.sorted_hashes
                ),
                "Identity is not registered"
            );
        });


        it("Should fail if proof fails", async function () {

            await this.identityFactory.registerIdentity(sender.value);

            await shouldRevert(this.registry.requireValidIdentity(
                validRootHash,
                sender.property,
                accounts[0],
                sender.salt,
                sender.sorted_hashes
                ),
                "Identity proof is not valid"
            );
        });

        it("Should pass with a valid proof and a registered identity", async function () {

            await this.registry.setOwnAddress(contractAddress);

            await this.registry.requireOneTokenPerDocument(
                validRootHash,
                nftUnique.value,
                nftUnique.salt,
                nftUnique.sorted_hashes
            )

            await this.identityFactory.registerIdentity(sender.value);

            await this.registry.requireValidIdentity(
                validRootHash,
                sender.property,
                sender.value,
                sender.salt,
                sender.sorted_hashes
            );
        })

    });


    describe("_requireOneTokenPerDocument", async function () {

        it("Should fail if the contract address does not match", async function () {
            await shouldRevert(this.registry.requireOneTokenPerDocument(
                validRootHash,
                nftUnique.value,
                nftUnique.salt,
                nftUnique.sorted_hashes
                ),
                "Token uniqueness proof is not valid"
            );
        });

        it("Should pass with a valid proof", async function () {
            await this.registry.setOwnAddress(contractAddress);

            await this.registry.requireOneTokenPerDocument(
                validRootHash,
                nftUnique.value,
                nftUnique.salt,
                nftUnique.sorted_hashes
            )
        })

    });


    describe("_hasReadRule", async function () {

        it("Should fail if the proof is not valid", async function () {
            await shouldRevert(this.registry.requireReadRole(
                validRootHash,
                "0x1",
                readRole.value,
                readRole.salt,
                readRole.sorted_hashes
                ),
                "Read Rule proof is not valid"
            );
        })

        it("Should pass and extract the proper index ", async function () {
            const index = await this.registry.requireReadRole(
                validRootHash,
                readRole.property,
                readRole.value,
                readRole.salt,
                readRole.sorted_hashes
            )

            assert.equal(index, readRuleIndex)
        })

    });

    describe("_requireReadAction", async function () {

        it("Should fail if read rule index is not valud", async function () {
             await shouldRevert(this.registry.requireReadAction(
                validRootHash,
                "0x0000000000000022",
                readRoleAction.salt,
                readRoleAction.sorted_hashes
                ),
                "Read Action is not valid"
            );
        })

        it("Should pass with the proper proof ", async function () {
             await this.registry.requireReadAction(
                validRootHash,
                readRuleIndex,
                readRoleAction.salt,
                readRoleAction.sorted_hashes
            )
        })

    });

    describe("_requireTokenHasRole", async function () {

        it("Should fail if the contract address does not match", async function () {
           await shouldRevert(this.registry.requireTokenHasRole(
                validRootHash,
                tokenId,
                tokenRole.property,
                readRole.value,
                tokenRole.salt,
                tokenRole.sorted_hashes
                ),
                "Token Role not valid"
            );
        })


        it("Should fail if the token Id does not match", async function () {
            await this.registry.setOwnAddress(contractAddress);
            await shouldRevert(this.registry.requireTokenHasRole(
                validRootHash,
                "0x1",
                tokenRole.property,
                readRole.value,
                tokenRole.salt,
                tokenRole.sorted_hashes
                ),
                "Token Role not valid"
            );
        })

        it("Should fail if the role index does not macth ", async function () {
            await this.registry.setOwnAddress(contractAddress);
            await shouldRevert(this.registry.requireTokenHasRole(
                validRootHash,
                tokenId,
                tokenRole.property,
                "0x1",
                tokenRole.salt,
                tokenRole.sorted_hashes
                ),
                "Token Role not valid"
            );
        })

        it("Should pass with a valid proof ", async function () {
            await this.registry.setOwnAddress(contractAddress);
            await this.registry.requireTokenHasRole(
                validRootHash,
                tokenId,
                tokenRole.property,
                readRole.value,
                tokenRole.salt,
                tokenRole.sorted_hashes
            )
        })

    });

    describe("_requireSignedByIdentity", async function () {

        it("Should fail when not all array values are provided ", async function () {
            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setIdentity(this.identity.address);

            await shouldRevert(this.registry.requireSignedByIdentity(
              [validRootHash, docDataRoot.value],
              [signature.value],
              1000,
              sender.value,
              signature.sorted_hashes,
              docDataRoot.sorted_hashes
              ),
              "b32Values length should be 3 and btsValues 1"
            );
        })

        it("Should fail when the docDataRoot is not part of the document ", async function () {
            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setIdentity(this.identity.address);

            await shouldRevert(this.registry.requireSignedByIdentity(
                [validRootHash, docDataRoot.value, signature.salt],
                [signature.value],
                1000,
                sender.value,
                signature.sorted_hashes,
                docDataRoot.sorted_hashes
                ),
                "Document Data Root not part of the document"
            );
        })

        it("Should fail when the docDataRoot is not part of the document ", async function () {
            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setIdentity(this.identity.address);

            await shouldRevert(this.registry.requireSignedByIdentity(
                [validRootHash, docDataRoot.value, signature.salt],
                [signature.value],
                1000,
                sender.value,
                signature.sorted_hashes,
                [...docDataRoot.sorted_hashes,documentIdentifier]
                ),
                "Document Data Root can have only one sibling"
            );
        })


        it("Should fail when signature is not part of the document root ", async function () {
            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setIdentity(this.identity.address);

            await shouldRevert(this.registry.requireSignedByIdentity(
                [validRootHash, docDataRoot.hash, signature.hash],
                [signature.value],
                1000,
                sender.value,
                signature.sorted_hashes,
                docDataRoot.sorted_hashes
                ),
                "Provided signature is not part of the document root"
            );
        })


        it("Should fail when it can not find the identity contract ", async function () {
            await this.registry.setOwnAddress(contractAddress);

            await shouldRevert(this.registry.requireSignedByIdentity(
                [validRootHash, docDataRoot.hash, signature.salt],
                [signature.value],
                1000,
                sender.value,
                signature.sorted_hashes,
                docDataRoot.sorted_hashes
                )
            );
        });
        it("Should fail when the signing key is not present on the identity ", async function () {
            let identity = await Identity.new(accounts[2],[accounts[1]],[P2P_SIGNATURE]);
            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setIdentity(identity.address);

            await shouldRevert(this.registry.requireSignedByIdentity(
                [validRootHash, docDataRoot.hash, signature.salt],
                [signature.value],
                1000,
                sender.value,
                signature.sorted_hashes,
                docDataRoot.sorted_hashes
                ),
                "Signature key not valid"
            );
        })

        it("Should fail when the anchor is after the key revocation ", async function () {
            let identity = await Identity.new(accounts[0],[publicKey],[P2P_SIGNATURE]);
            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setIdentity(identity.address);
            await identity.revokeKey(publicKey);

            await shouldRevert(this.registry.requireSignedByIdentity(
                [validRootHash, docDataRoot.hash, signature.salt],
                [signature.value],
                999999,
                sender.value,
                signature.sorted_hashes,
                docDataRoot.sorted_hashes
                ),
                "Document signed with a revoked key"
            );
        })

        it("Should pass with a valid signature and a valid Identity ", async function () {
            await this.registry.setOwnAddress(contractAddress);
            await this.registry.setIdentity(this.identity.address);

            await this.registry.requireSignedByIdentity(
                [validRootHash, docDataRoot.hash, signature.salt],
                [signature.value],
                1000,
                sender.value,
                signature.sorted_hashes,
                docDataRoot.sorted_hashes
            )
        })

    });


    describe("_mintAnchor", async function () {

        it("should mint a token if the Merkle proofs validates", async function () {
            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );
            await this.registry.mintAnchor(
                accounts[2],
                tokenId,
                documentIdentifier,
                validRootHash,
                [
                    grossAmount.value,
                    currency.value
                ],
                [
                    grossAmount.salt,
                    currency.salt
                ],
                [
                    grossAmount.sorted_hashes,
                    currency.sorted_hashes
                ]
            )

            let tokenUri = await this.registry.tokenURI(tokenId);
            // Validate the tokenURi
            assert.equal(tokenUri.toLowerCase(),`${tokenUriBase}${this.registry.address}/${tokenId}`.toLowerCase());
            const firstTokenIndex = await this.registry.currentIndexOfToken(tokenId);

            // Mint a second nft
            const newtokenId = 999999;
            await this.registry.mintAnchor(
                accounts[2],
                newtokenId,
                documentIdentifier,
                validRootHash,
                [
                    grossAmount.value,
                    currency.value
                ],
                [
                    grossAmount.salt,
                    currency.salt
                ],
                [
                    grossAmount.sorted_hashes,
                    currency.sorted_hashes
                ]
            )

            const secondTokenIndex = await this.registry.currentIndexOfToken(newtokenId);
            const totalSupply = await this.registry.totalSupply();

            assert.equal(firstTokenIndex.toNumber(),0);
            assert.equal(secondTokenIndex.toNumber(),1);
            assert.equal(totalSupply.toNumber(),2);

        });

        it("should fail when minting an existing token", async function () {
            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );
            await this.registry.mintAnchor(
                accounts[2],
                tokenId,
                documentIdentifier,
                validRootHash,
                [
                    grossAmount.value,
                    currency.value
                ],
                [
                    grossAmount.salt,
                    currency.salt
                ],
                [
                    grossAmount.sorted_hashes,
                    currency.sorted_hashes
                ]
            )

            await shouldRevert(this.registry.mintAnchor(
                accounts[2],
                tokenId,
                documentIdentifier,
                validRootHash,
                [
                    grossAmount.value,
                    currency.value
                ],
                [
                    grossAmount.salt,
                    currency.salt
                ],
                [
                    grossAmount.sorted_hashes,
                    currency.sorted_hashes
                ]
            ))

        });


        it("should fail minting a token if the document proofs do not validate", async function () {
            let invalidRootHash = "0x1e5e444f4c4c7278f5f31aeb407c3804e7c34f79f72b8438be665f8cee935744";
            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                invalidRootHash
            );

            await shouldRevert(this.registry.mintAnchor(
                accounts[2],
                tokenId,
                documentIdentifier,
                invalidRootHash,
                [
                    grossAmount.value,
                    currency.value
                ],
                [
                    grossAmount.salt,
                    currency.salt
                ],
                [
                    grossAmount.sorted_hashes,
                    currency.sorted_hashes
                ]
            ))
        });
    });
});
