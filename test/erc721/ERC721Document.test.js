const shouldRevert = require('../tools/assertTx').shouldRevert
const {bufferToHex, sha256} = require("ethereumjs-util");
let UserMintableERC721 = artifacts.require("UserMintableERC721");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let MockIdentityFactory = artifacts.require("MockIdentityFactory");
let MockUserMintableERC721 = artifacts.require("MockUserMintableERC721");
let proof = require("./proof.js");



contract("UserMintableERC721", function (accounts) {

    let {
        grossAmount,
        currency,
        sender,
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
    } = proof;

    const mandatoryFields = [grossAmount.property, currency.property];


    beforeEach(async function () {
        this.anchorRegistry = await MockAnchorRegistry.new();
        this.identityFactory = await MockIdentityFactory.new();
        this.registry = await UserMintableERC721.new();
        await this.registry.initialize("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields)
    });

    describe("UserMintableERC721 Deployment", async function () {

        it("should be deployable as an independent registry", async function () {
            let anchorRegistry = await MockAnchorRegistry.new();
            let identityFactory = await MockIdentityFactory.new();
            let instance = await UserMintableERC721.new();
            await instance.initialize("ERC721 Document Anchor 2", "TDA2", anchorRegistry.address, identityFactory.address, mandatoryFields);

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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            const anchoredRoot = await mockRegistry.getDocumentRoot(
                documentIdentifier
            )

            assert.equal(
                anchoredRoot,
                validRootHash
            );
        })

        it("Should fail if the document anchor is not in the registry", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);
            await shouldRevert(
                mockRegistry.getDocumentRoot(
                    documentIdentifier
                ),
                "Document in not anchored in the registry"
            );
        })


    });


    describe("_requireIsLatestDocumentVersion", async function () {

        it("Should validate that the document version is the latest ", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );

            await mockRegistry.requireIsLatestDocumentVersion(
                validRootHash,
                nextVersion.value,
                nextVersion.salt,
                nextVersion.sorted_hashes
            );
        })

        it("Should fail when there is a newer version of the document ", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            //anchor next identifier
            await this.anchorRegistry.setAnchorById(
                nextVersion.value,
                validRootHash
            );


            await shouldRevert(
                mockRegistry.requireIsLatestDocumentVersion(
                    validRootHash,
                    nextVersion.value,
                    nextVersion.salt,
                    nextVersion.sorted_hashes
                ),
                "Document has a newer version on chain"
            )


        })

        it("Should fail if the next version proof is not valid", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await shouldRevert(
                mockRegistry.requireIsLatestDocumentVersion(
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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await shouldRevert(mockRegistry.requireValidIdentity(
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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await this.identityFactory.registerIdentity(sender.value);

            await shouldRevert(mockRegistry.requireValidIdentity(
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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await mockRegistry.setOwnAddress(contractAddress);

            await mockRegistry.requireOneTokenPerDocument(
                validRootHash,
                nftUnique.value,
                nftUnique.salt,
                nftUnique.sorted_hashes
            )

            await this.identityFactory.registerIdentity(sender.value);

            await mockRegistry.requireValidIdentity(
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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);


            await shouldRevert(mockRegistry.requireOneTokenPerDocument(
                validRootHash,
                nftUnique.value,
                nftUnique.salt,
                nftUnique.sorted_hashes
                ),
                "Token uniqueness proof is not valid"
            );
        });

        it("Should pass with a valid proof", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await mockRegistry.setOwnAddress(contractAddress);

            await mockRegistry.requireOneTokenPerDocument(
                validRootHash,
                nftUnique.value,
                nftUnique.salt,
                nftUnique.sorted_hashes
            )
        })

    });


    describe("_hasReadRule", async function () {

        it("Should fail if the proof is not valid", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);


            await shouldRevert(mockRegistry.requireReadRole(
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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            const index = await mockRegistry.requireReadRole(
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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);


            await shouldRevert(mockRegistry.requireReadAction(
                validRootHash,
                "0x0000000000000022",
                readRoleAction.salt,
                readRoleAction.sorted_hashes
                ),
                "Read Action is not valid"
            );
        })

        it("Should pass with the proper proof ", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await mockRegistry.requireReadAction(
                validRootHash,
                readRuleIndex,
                readRoleAction.salt,
                readRoleAction.sorted_hashes
            )
        })

    });

    describe("_requireTokenHasRole", async function () {

        it("Should fail if the contract address does not match", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await shouldRevert(mockRegistry.requireTokenHasRole(
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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await mockRegistry.setOwnAddress(contractAddress);
            await shouldRevert(mockRegistry.requireTokenHasRole(
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

            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await mockRegistry.setOwnAddress(contractAddress);
            await shouldRevert(mockRegistry.requireTokenHasRole(
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

            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);

            await mockRegistry.setOwnAddress(contractAddress);
            await mockRegistry.requireTokenHasRole(
                validRootHash,
                tokenId,
                tokenRole.property,
                readRole.value,
                tokenRole.salt,
                tokenRole.sorted_hashes
            )
        })

    });


    describe("_mintAnchor", async function () {

        it("should mint a token if the Merkle proofs validates", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);
            let tokenURI = "http://test.com";
            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );
            const tokenId = 1;
            await mockRegistry.mintAnchor(
                accounts[2],
                tokenId,
                documentIdentifier,
                validRootHash,
                tokenURI,
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

        });

        it("should fail when minting an existing token", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);
            let tokenURI = "http://test.com";
            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                validRootHash
            );
            const tokenId = 1;
            await mockRegistry.mintAnchor(
                accounts[2],
                tokenId,
                documentIdentifier,
                validRootHash,
                tokenURI,
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

            await shouldRevert(mockRegistry.mintAnchor(
                accounts[2],
                tokenId,
                documentIdentifier,
                validRootHash,
                tokenURI,
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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, this.identityFactory.address, mandatoryFields);
            let invalidRootHash = "0x1e5e444f4c4c7278f5f31aeb407c3804e7c34f79f72b8438be665f8cee935744"
            let tokenURI = "http://test.com";
            await this.anchorRegistry.setAnchorById(
                documentIdentifier,
                invalidRootHash
            );
            const tokenId = 1;


            await shouldRevert(mockRegistry.mintAnchor(
                accounts[2],
                tokenId,
                documentIdentifier,
                invalidRootHash,
                tokenURI
                ,
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
