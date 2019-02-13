const shouldRevert = require('../tools/assertTx').shouldRevert
const {bufferToHex, sha256} = require("ethereumjs-util");
let UserMintableERC721 = artifacts.require("UserMintableERC721");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let MockUserMintableERC721 = artifacts.require("MockUserMintableERC721");


let proof = require('./proof.json');
const mandatoryFields = [proof.field_proofs[0].property, proof.field_proofs[1].property];

const base64ToHex = function (_base64String) {
    return bufferToHex(Buffer.from(_base64String, "base64"));
}

const produceValidLeafHash = function (_leafName, _leafValue, _salt) {
    let leafName = Buffer.from(_leafName, "utf8");
    let leafValue = Buffer.from(_leafValue, "utf8");
    let salt = Buffer.from(_salt, "base64");

    return bufferToHex(sha256(Buffer.concat([leafName, leafValue, salt])));
};

const getValidProofHashes = function () {
    /**
     * This is a proof coming from the precise-proofs library via
     * https://github.com/centrifuge/precise-proofs/blob/master/examples/simple.go
     * using sha256 as the hashing algorithm
     *
     */
    return [
        base64ToHex("JrxNtvtMwWnJMKh1OV6pqUkdBnrWt0u9qf+MShO6QcM="),
        base64ToHex("hLEULVXQaL5hd4J7NooO8QptJ+AEICkIAOQyifGN3/g="),
        base64ToHex("4YQrPgzU2NXdmlC8ycoMxEurnTHxCy8cjB42rPdvm2Q=")
    ];
}

contract("UserMintableERC721", function (accounts) {
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

        // TODO this is more complex.
        // it("should fail to deploy with an invalid anchor registry", async function () {
        //     await shouldRevert(UserMintableERC721.new("ERC721 Document Anchor", "TDA", "0x1"));
        // });
    });


    describe("_getDocumentRoot", async function () {

        it("Should return the correct anchored document root", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);
            let documentIdentifer = proof.header.version_id;
            let validRootHash = proof.header.document_root;

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
            let documentIdentifer = proof.header.version_id;
            let validRootHash = proof.header.document_root;

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );

            await mockRegistry.isLatestDocumentVersion(
                validRootHash,
                proof.field_proofs[4].value,
                proof.field_proofs[4].salt,
                proof.field_proofs[4].sorted_hashes
            );
        })

        it("Should fail when there is a newer version of the document ", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);
            let documentIdentifer = proof.header.version_id;
            let validRootHash = proof.header.document_root;

            //anchor next identifier
            await this.anchorRegistry.setAnchorById(
                // TODO remove this and use value from the json when string conversion is not a problem anymore
                '0x4e738fd412c2ff130d0dac552aaa52766638',
                validRootHash
            );
            console.log( web3.utils.toHex(await mockRegistry.isLatestDocumentVersion(
                validRootHash,
                proof.field_proofs[4].value,
                proof.field_proofs[4].salt,
                proof.field_proofs[4].sorted_hashes
            )))
            await shouldRevert(
                  mockRegistry.isLatestDocumentVersion(
                    validRootHash,
                    proof.field_proofs[4].value,
                    proof.field_proofs[4].salt,
                    proof.field_proofs[4].sorted_hashes
                ),
                "Document has a newer version on chain"
            )


        })

        it("Should fail if the next version proof is not valid", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);
            let documentIdentifer = proof.header.version_id;
            let validRootHash = proof.header.document_root;

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );

            await shouldRevert(
                 mockRegistry.isLatestDocumentVersion(
                    validRootHash,
                    "0x3333444",
                    proof.field_proofs[4].salt,
                    proof.field_proofs[4].sorted_hashes
                ),
                "Next version proof is not valid"
            );
        })




    });

    describe("_hashLeafData", async function () {

        it("should hash the leaf data the same way JS does", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);

            let leafName_ = "valueA";
            let leafValue_ = "Foo";
            let salt_ = "aoXdxhE+aM2mhDyvNwoFT6pgcaM4wmdD+LunX0tPupw=";

            let validLeafHash = produceValidLeafHash(leafName_, leafValue_, salt_);

            let res = await mockRegistry.hashLeafData.call(leafName_, leafValue_, base64ToHex(salt_));
            assert.equal(validLeafHash, res, "Solidity hashing should be the same as JS hashing");
        });
    });


    describe("mintAnchor", async function () {

        it("should mint a token if the Merkle proofs validates", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);
            let documentIdentifer = proof.header.version_id;
            let validRootHash = proof.header.document_root;
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


        it("should fail minting a token if the document proofs do not validate", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, mandatoryFields);
            let documentIdentifer = proof.header.version_id;
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
