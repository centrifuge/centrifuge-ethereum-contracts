import {shouldRevert} from "../tools/assertTx";

const {bufferToHex, sha256} = require("ethereumjs-util");
let UserMintableERC721 = artifacts.require("UserMintableERC721");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let MockUserMintableERC721 = artifacts.require("MockUserMintableERC721");


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
        this.registry = await UserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address);
    });

    describe("UserMintableERC721", async function () {

        it("should be deployable as an independent registry", async function () {
            let anchorRegistry = await MockAnchorRegistry.new();
            let instance = await UserMintableERC721.new("ERC721 Document Anchor 2", "TDA2", anchorRegistry.address);

            assert.equal("ERC721 Document Anchor 2", await instance.name.call(), "The registry should be deployed with the specific name");
            assert.equal("TDA2", await instance.symbol.call(), "The registry should be deployed with the specific symbol");
            assert.equal(anchorRegistry.address, await instance.anchorRegistry.call(), "The registry should be deployed with the specific anchor registry");
        });


        it("should be able to check if documents are registered on the anchor registry", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address);

            await this.anchorRegistry.setAnchorById(
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
            );

            assert.equal(
                false,
                await mockRegistry.isValidAnchor.call(
                    "0x0",
                    "0x0"
                ),
                "Registry check should fail for 0x0 data"
            );
            assert.equal(
                false,
                await mockRegistry.isValidAnchor.call(
                    "0x9aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa9",
                    "0x9bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb9"
                ),
                "Registry check should fail for not-found anchor"
            );
            assert.equal(
                false,
                await mockRegistry.isValidAnchor.call(
                    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "0x9bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb9"
                ),
                "Registry check should fail for wrong anchor merkle root"
            );

            assert.equal(
                true,
                await mockRegistry.isValidAnchor.call(
                    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
                ),
                "Registry check should succeed with correct data"
            );
        });
    });


    describe("_hashLeafData", async function () {
        it("should hash the leaf data the same way JS does", async function () {
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address);

            let leafName_ = "valueA";
            let leafValue_ = "Foo";
            let salt_ = "aoXdxhE+aM2mhDyvNwoFT6pgcaM4wmdD+LunX0tPupw=";

            let validLeafHash = produceValidLeafHash(leafName_, leafValue_, salt_);

            let res = await mockRegistry.hashLeafData.call(leafName_, leafValue_, base64ToHex(salt_));
            assert.equal(validLeafHash, res, "Solidity hashing should be the same as JS hashing");
        });
    });




    describe("mintAnchor", async function () {
        it("should mint a token if the Merkle proof validates", async function () {
            let documentIdentifer = "0xce5b7b97141cbf0a447e1d7bb29794f3d8ff276c5974061f4aefc90cbba35eaf";
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address);
            let validRootHash = base64ToHex("7fo13k/hjw+cCLT+SN4JdazaP2gMZ0jrhYtjKYL1C4M=");
            let tokenURI = "http://test.com";
            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );
            
            await mockRegistry.mintAnchor.call(
                "0x1",
                1,
                documentIdentifer,
                validRootHash,
                tokenURI
            )
        });


        it("should fail minting a token if the document idenfitier is not found", async function () {
            let documentIdentifer = "0xce5b7b97141cbf0a447e1d7bb29794f3d8ff276c5974061f4aefc90cbba35eaf";
            let mockRegistry = await MockUserMintableERC721.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address);
            let tokenURI = "http://test.com";
            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                "0x1e5e444f4c4c7278f5f31aeb407c3804e7c34f79f72b8438be665f8cee935744"
            );

            let validProof = getValidProofHashes();

            //root hash is 0x1e5e444f4c4c7278f5f31aeb407c3804e7c34f79f72b8438be665f8cee935744 in hex
            let validRootHash = bufferToHex(Buffer.from("7fo13k/hjw+cCLT+SN4JdazaP2gMZ0jrhYtjKYL1C4M=", "base64"));
            let validLeaf = produceValidLeafHash("valueA", "Foo", "aoXdxhE+aM2mhDyvNwoFT6pgcaM4wmdD+LunX0tPupw=");

            let invalidDocumentIdentifier = "0x93ab1b97141cbf0a447e1d7bb29794f3d8ff276c5974061f4aefc90cbba48afe"

            await shouldRevert(mockRegistry.mintAnchor(
                "0x1",
                1,
                invalidDocumentIdentifier,
                validRootHash,
                tokenURI
            ));
        });
    });
});