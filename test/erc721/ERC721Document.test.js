const shouldRevert = require('../tools/assertTx').shouldRevert
const {bufferToHex, sha256} = require("ethereumjs-util");
let UserMintableERC721 = artifacts.require("UserMintableERC721");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let MockUserMintableERC721 = artifacts.require("MockUserMintableERC721");


let proof = require('./proof.json');
const mandatoryFields = [proof.field_proofs[0].property, proof.field_proofs[1].property];

contract("UserMintableERC721", function (accounts) {


    let nextVersion = proof.field_proofs[5];
    let nftUnique = proof.field_proofs[4];
    let tokenId = nftUnique.value;
    let readRole = proof.field_proofs[6];
    let tokenRole = proof.field_proofs[7];
    let readRoleAction = proof.field_proofs[8];
    let documentIdentifer = proof.header.version_id;
    let validRootHash = proof.header.document_root;
    let readRuleIndex = "0x" + readRole.property.substr(10, 16);
    let contractAddress = "0x910e4e12FC1f0fFBA5D9Bf79ad5760155d3f62C8";


    beforeEach(async function () {
        this.anchorRegistry = await MockAnchorRegistry.new();
        this.registry = await UserMintableERC721.new();
        await this.registry.initialize("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields)
    });

     describe("UserMintableERC721 Deployment", async function () {

         it("should be deployable as an independent registry", async function () {
             let anchorRegistry = await MockAnchorRegistry.new();
             let instance = await UserMintableERC721.new();
             await instance.initialize("ERC721 Document Anchor 2", "TDA2", anchorRegistry.address, mandatoryFields);

             assert.equal("ERC721 Document Anchor 2", await instance.name.call(), "The registry should be deployed with the specific name");
             assert.equal("TDA2", await instance.symbol.call(), "The registry should be deployed with the specific symbol");
             assert.equal(anchorRegistry.address, await instance.anchorRegistry.call(), "The registry should be deployed with the specific anchor registry");
         });

         // TODO Should we check the interface of the anchorRegistry?
         // it("should fail to deploy with an invalid anchor registry", async function () {
         //     await shouldRevert(UserMintableERC721.new("ERC721 Document Anchor", "TDA", "0x1"));
         // });
     });


     describe("_getDocumentRoot", async function () {

         it("Should return the correct anchored document root", async function () {
             let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

             await this.anchorRegistry.setAnchorById(
                 documentIdentifer,
                 validRootHash
             );

             const anchoredRoot = await mockRegistry.getDocumentRoot(
                 documentIdentifer
             )

             assert.equal(
                 anchoredRoot,
                 validRootHash
             );
         })

         it("Should fail if the document anchor is not in the registry", async function () {
             let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);
             let documentIdentifer = proof.header.version_id;

             await shouldRevert(
                 mockRegistry.getDocumentRoot(
                     documentIdentifer
                 ),
                 "Document in not anchored in the registry"
             );
         })


     });


     describe("_isLatestDocumentVersion", async function () {

         it("Should validate that the document version is the latest ", async function () {
             let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

             await this.anchorRegistry.setAnchorById(
                 documentIdentifer,
                 validRootHash
             );

             await mockRegistry.isLatestDocumentVersion(
                 validRootHash,
                 nextVersion.value,
                 nextVersion.salt,
                 nextVersion.sorted_hashes
             );
         })

         it("Should fail when there is a newer version of the document ", async function () {
             let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);
             let documentIdentifer = proof.header.version_id;
             let validRootHash = proof.header.document_root;

             //anchor next identifier
             await this.anchorRegistry.setAnchorById(
                 nextVersion.value,
                 validRootHash
             );


             await shouldRevert(
                 mockRegistry.isLatestDocumentVersion(
                     validRootHash,
                     nextVersion.value,
                     nextVersion.salt,
                     nextVersion.sorted_hashes
                 ),
                 "Document has a newer version on chain"
             )


         })

         it("Should fail if the next version proof is not valid", async function () {
             let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

             await shouldRevert(
                 mockRegistry.isLatestDocumentVersion(
                     validRootHash,
                     documentIdentifer,
                     nextVersion.salt,
                     nextVersion.sorted_hashes
                 ),
                 "Next version proof is not valid"
             );
         })


     });


    describe("_oneTokenPerDocument", async function () {

        it("Should fail if the contract address does not match", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);


            await shouldRevert(mockRegistry.oneTokenPerDocument(
                validRootHash,
                nftUnique.value,
                nftUnique.salt,
                nftUnique.sorted_hashes
                ),
                "Token uniqueness proof is not valid"
            );
        });

        it("Should pass with a valid proof", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

            await mockRegistry.setOwnAddress(contractAddress);

            await mockRegistry.oneTokenPerDocument(
                validRootHash,
                nftUnique.value,
                nftUnique.salt,
                nftUnique.sorted_hashes
            )
        })

    });


    describe("_hasReadRule", async function () {

        it("Should fail if the proof is not valid", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);


            await shouldRevert(mockRegistry.hasReadRole(
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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

            const index = await mockRegistry.hasReadRole(
                validRootHash,
                readRole.property,
                readRole.value,
                readRole.salt,
                readRole.sorted_hashes
            )

            assert.equal(index, readRuleIndex)
        })

    });

    describe("_hasReadAction", async function () {

        it("Should fail if read rule index is not valud", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);


            await shouldRevert(mockRegistry.hasReadAction(
                validRootHash,
                "0x0000000000000022",
                readRoleAction.salt,
                readRoleAction.sorted_hashes
                ),
                "Read Action is not valid"
            );
        })

        it("Should pass with the proper proof ", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

            await mockRegistry.hasReadAction(
                validRootHash,
                readRuleIndex,
                readRoleAction.salt,
                readRoleAction.sorted_hashes
            )
        })

    });

    describe("_tokenHasRole", async function () {

        it("Should fail if the contract address does not match", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

            await shouldRevert(mockRegistry.tokenHasRole(
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
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

            await mockRegistry.setOwnAddress(contractAddress);
            await shouldRevert(mockRegistry.tokenHasRole(
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

            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

            await mockRegistry.setOwnAddress(contractAddress);
            await shouldRevert(mockRegistry.tokenHasRole(
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

            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

            await mockRegistry.setOwnAddress(contractAddress);
            await mockRegistry.tokenHasRole(
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
             let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);
             let tokenURI = "http://test.com";
             await this.anchorRegistry.setAnchorById(
                 documentIdentifer,
                 validRootHash
             );
             const tokenId = 1;
             await mockRegistry.mintAnchor(
                 accounts[2],
                 tokenId,
                 documentIdentifer,
                 validRootHash,
                 tokenURI,
                 [
                     proof.field_proofs[0].value,
                     proof.field_proofs[1].value
                 ],
                 [
                     proof.field_proofs[0].salt,
                     proof.field_proofs[1].salt
                 ],
                 [
                     proof.field_proofs[0].sorted_hashes,
                     proof.field_proofs[1].sorted_hashes
                 ]
             )

         });

         it("should fail when minting an existing token", async function () {
             let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);
             let tokenURI = "http://test.com";
             await this.anchorRegistry.setAnchorById(
                 documentIdentifer,
                 validRootHash
             );
             const tokenId = 1;
             await mockRegistry.mintAnchor(
                 accounts[2],
                 tokenId,
                 documentIdentifer,
                 validRootHash,
                 tokenURI,
                 [
                     proof.field_proofs[0].value,
                     proof.field_proofs[1].value
                 ],
                 [
                     proof.field_proofs[0].salt,
                     proof.field_proofs[1].salt
                 ],
                 [
                     proof.field_proofs[0].sorted_hashes,
                     proof.field_proofs[1].sorted_hashes
                 ]
             )

             await shouldRevert(mockRegistry.mintAnchor(
                 accounts[2],
                 tokenId,
                 documentIdentifer,
                 validRootHash,
                 tokenURI,
                 [
                     proof.field_proofs[0].value,
                     proof.field_proofs[1].value
                 ],
                 [
                     proof.field_proofs[0].salt,
                     proof.field_proofs[1].salt
                 ],
                 [
                     proof.field_proofs[0].sorted_hashes,
                     proof.field_proofs[1].sorted_hashes
                 ]
             ))

         });



         it("should fail minting a token if the document proofs do not validate", async function () {
             let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);
             let invalidRootHash = "0x1e5e444f4c4c7278f5f31aeb407c3804e7c34f79f72b8438be665f8cee935744"
             let tokenURI = "http://test.com";
             await this.anchorRegistry.setAnchorById(
                 documentIdentifer,
                 invalidRootHash
             );
             const tokenId = 1;


             await shouldRevert(mockRegistry.mintAnchor(
                 accounts[2],
                 tokenId,
                 documentIdentifer,
                 invalidRootHash,
                 tokenURI
                 ,
                 [
                     proof.field_proofs[0].value,
                     proof.field_proofs[1].value
                 ],
                 [
                     proof.field_proofs[0].salt,
                     proof.field_proofs[1].salt
                 ],
                 [
                     proof.field_proofs[0].sorted_hashes,
                     proof.field_proofs[1].sorted_hashes
                 ]
             ))
         });
     });
});
