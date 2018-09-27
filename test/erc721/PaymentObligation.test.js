import {shouldRevert} from "../tools/assertTx";

const {bufferToHex, keccak, toBuffer} = require("ethereumjs-util");
let PaymentObligation = artifacts.require("PaymentObligation");
let UserMintableERC721 = artifacts.require("UserMintableERC721");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let IdentityRegistry = artifacts.require("IdentityRegistry");
let Identity = artifacts.require("Identity");
let proof = require('./proof.json');



const stringToByte32 = (str) => {
    return '0x' + Buffer.from(str, 'utf8').toString('hex');
}

const base64ToHex = function (_base64String) {
    return bufferToHex(Buffer.from(_base64String, "base64"));
}

const produceValidLeafHash = function (_leafName, _leafValue, _salt) {
    let leafName = Buffer.from(_leafName, "utf8");
    let leafValue = Buffer.from(_leafValue, "utf8");
    let salt = Buffer.from(_salt, "base64");

    return bufferToHex(keccak(Buffer.concat([leafName, leafValue, salt])));
};


const getValidProofHashes = function () {
    /**
     * This is a proof coming from the precise-proofs library via
     * https://github.com/centrifuge/precise-proofs/blob/master/examples/simple.go
     * using Keccak256 as the hashing algorithm
     *
     */
    return [
        base64ToHex("JrxNtvtMwWnJMKh1OV6pqUkdBnrWt0u9qf+MShO6QcM="),
        base64ToHex("hLEULVXQaL5hd4J7NooO8QptJ+AEICkIAOQyifGN3/g="),
        base64ToHex("4YQrPgzU2NXdmlC8ycoMxEurnTHxCy8cjB42rPdvm2Q=")
    ];
}

let deployedCentrifugeId = "0x24fe6555beb9";
let deployedIdentity;
let deployedIdentityRegistry;


contract("PaymentObligation", function (accounts) {
    before(async function () {

        deployedIdentityRegistry = await IdentityRegistry.deployed();
        deployedIdentity = await Identity.new(deployedCentrifugeId);
        await deployedIdentityRegistry.registerIdentity(deployedCentrifugeId, deployedIdentity.address);
    });

    beforeEach(async function () {
        this.anchorRegistry = await MockAnchorRegistry.new();
        this.registry = await PaymentObligation.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, deployedIdentityRegistry.address);
    });


    describe("mint", async function () {

        it("should mint a token if the Merkle proofs validates", async function () {

            let documentIdentifer = base64ToHex(proof.document_identifier);
            let validRootHash = base64ToHex(proof.document_root);

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );

            const tokenId = 1;

            await this.registry.mint(
                "0x3",
                tokenId,
                documentIdentifer,
                validRootHash,
                [
                    stringToByte32(proof.field_proofs[0].value),
                    stringToByte32(proof.field_proofs[1].value),
                    stringToByte32(proof.field_proofs[2].value),
                ],
                [
                    base64ToHex(proof.field_proofs[0].salt),
                    base64ToHex(proof.field_proofs[1].salt),
                    base64ToHex(proof.field_proofs[2].salt),
                ],
                proof.field_proofs[0].sortedHashes.map(item => base64ToHex(item)),
                proof.field_proofs[1].sortedHashes.map(item => base64ToHex(item)),
                proof.field_proofs[2].sortedHashes.map(item => base64ToHex(item))
            );

            let tokenDetails = await this.registry.getTokenDetails(tokenId);

            assert.equal(tokenDetails[0],proof.field_proofs[0].value)
            assert.equal(tokenDetails[1],proof.field_proofs[1].value)
            assert.equal(tokenDetails[2],proof.field_proofs[2].value)
            assert.equal(web3.toHex(tokenDetails[3]),documentIdentifer)
            assert.equal(tokenDetails[4],validRootHash)
        });

        it("should not mint a token if the a Merkle proof fails", async function () {

            let documentIdentifer = base64ToHex(proof.document_identifier);
            let validRootHash = base64ToHex(proof.document_root);

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );

            const tokenId = 1;

            await shouldRevert(this.registry.mint(
                "0x3",
                tokenId,
                documentIdentifer,
                validRootHash,
                [
                    stringToByte32("some random value"),
                    stringToByte32(proof.field_proofs[1].value),
                    stringToByte32(proof.field_proofs[2].value),
                ],
                [
                    base64ToHex(proof.field_proofs[0].salt),
                    base64ToHex(proof.field_proofs[1].salt),
                    base64ToHex(proof.field_proofs[2].salt),
                ],
                proof.field_proofs[0].sortedHashes.map(item => base64ToHex(item)),
                proof.field_proofs[1].sortedHashes.map(item => base64ToHex(item)),
                proof.field_proofs[2].sortedHashes.map(item => base64ToHex(item))
            ));

        });


    });


});