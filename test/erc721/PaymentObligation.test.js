import {shouldRevert} from "../tools/assertTx";
import {assertEvent, getEvents, getEventValue} from "../tools/contractEvents";

const {bufferToHex, keccak, toBuffer} = require("ethereumjs-util");
let PaymentObligation = artifacts.require("PaymentObligation");
let UserMintableERC721 = artifacts.require("UserMintableERC721");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let IdentityRegistry = artifacts.require("IdentityRegistry");
let Identity = artifacts.require("Identity");
let proof = require('./proof.json');
let Web3 = require('web3');
let latestWeb3 = new Web3(web3.currentProvider);

const stringToByte32 = (str) => {
    return str;
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


const transationOptions = {
    from: '0xD77C534AED04D7Ce34Cd425073a033dB4FBe6a9d',
    gas: 4712388,
    gasPrice: 20000000000
}

contract("PaymentObligation", function (accounts) {
    before(async function () {

        deployedIdentityRegistry = await IdentityRegistry.deployed();
        deployedIdentity = await Identity.new(deployedCentrifugeId);
        await deployedIdentityRegistry.registerIdentity(deployedCentrifugeId, deployedIdentity.address);
    });

    beforeEach(async function () {
        this.anchorRegistry = await MockAnchorRegistry.new();
        const deployedPaymentObligation = await PaymentObligation.new("ERC-721 Document Anchor", "TDA", this.anchorRegistry.address, deployedIdentityRegistry.address);

        // setup web3 1.0 contracts
        this.registry = new latestWeb3.eth.Contract(deployedPaymentObligation.abi, deployedPaymentObligation.address);
    });


    describe("mint", async function () {


        it("should mint a token if the Merkle proofs validates", async function () {

            let documentIdentifer = base64ToHex(proof.document_identifier);
            let validRootHash = base64ToHex(proof.document_root);
            let tokenURI = "http://test.com";

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );

            const tokenId = 1;


            let fields = [
                [
                    stringToByte32(proof.field_proofs[0].value),
                    base64ToHex(proof.field_proofs[0].salt),
                    proof.field_proofs[0].sortedHashes.map(item => base64ToHex(item)),
                ],
                [
                    stringToByte32(proof.field_proofs[1].value),
                    base64ToHex(proof.field_proofs[1].salt),
                    proof.field_proofs[1].sortedHashes.map(item => base64ToHex(item)),
                ],

                [
                    stringToByte32(proof.field_proofs[2].value),
                    base64ToHex(proof.field_proofs[2].salt),
                    proof.field_proofs[2].sortedHashes.map(item => base64ToHex(item)),
                ]
            ]

            await this.registry.methods.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifer,
                validRootHash,
                fields
            ).send(transationOptions)
                .then(function (tx) {
                    // Check mint event
                    const event = tx.events.PaymentObligationMinted.returnValues;
                    assert.equal(event.to.toLowerCase(), accounts[2]);
                    assert.equal(event.tokenId, tokenId);
                    assert.equal(event.tokenURI, tokenURI);
                });


            // check token details
            let tokenDetails = await this.registry.methods.getTokenDetails(tokenId).call(transationOptions);
            assert.equal(tokenDetails[0], proof.field_proofs[0].value)
            assert.equal(tokenDetails[1], proof.field_proofs[1].value)
            assert.equal(tokenDetails[2], proof.field_proofs[2].value)
            assert.equal(web3.toHex(tokenDetails[3]), documentIdentifer)
            assert.equal(tokenDetails[4], validRootHash)

            //check token uri
            let tokenUri = await this.registry.methods.tokenURI(tokenId).call(transationOptions);
            assert.equal(tokenUri, tokenURI)
        });


        it("should not mint a token if the a Merkle proof fails", async function () {

            let documentIdentifer = base64ToHex(proof.document_identifier);
            let validRootHash = base64ToHex(proof.document_root);
            let tokenURI = "http://test.com";

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );

            const tokenId = 1;
            let fields = [
                [
                    stringToByte32("Some Random value"),
                    base64ToHex(proof.field_proofs[0].salt),
                    proof.field_proofs[0].sortedHashes.map(item => base64ToHex(item)),
                ],
                [
                    stringToByte32(proof.field_proofs[1].value),
                    base64ToHex(proof.field_proofs[1].salt),
                    proof.field_proofs[1].sortedHashes.map(item => base64ToHex(item)),
                ],

                [
                    stringToByte32(proof.field_proofs[2].value),
                    base64ToHex(proof.field_proofs[2].salt),
                    proof.field_proofs[2].sortedHashes.map(item => base64ToHex(item)),
                ]
            ]

            await shouldRevert(this.registry.methods.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifer,
                validRootHash,
                fields
            ).send(transationOptions));

        });

        it("should not mint a token if the anchorId has been used before", async function () {

            let documentIdentifer = base64ToHex(proof.document_identifier);
            let validRootHash = base64ToHex(proof.document_root);
            let tokenURI = "http://test.com";

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );

            const tokenId = 1;
            let fields = [
                [
                    stringToByte32(proof.field_proofs[0].value),
                    base64ToHex(proof.field_proofs[0].salt),
                    proof.field_proofs[0].sortedHashes.map(item => base64ToHex(item)),
                ],
                [
                    stringToByte32(proof.field_proofs[1].value),
                    base64ToHex(proof.field_proofs[1].salt),
                    proof.field_proofs[1].sortedHashes.map(item => base64ToHex(item)),
                ],

                [
                    stringToByte32(proof.field_proofs[2].value),
                    base64ToHex(proof.field_proofs[2].salt),
                    proof.field_proofs[2].sortedHashes.map(item => base64ToHex(item)),
                ]
            ]

            this.registry.methods.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifer,
                validRootHash,
                fields
            ).send(transationOptions)

            await shouldRevert(this.registry.methods.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifer,
                validRootHash,
                fields
            ).send(transationOptions));

        });

    });

    describe("check the gas cost for mint", async function () {

        const mintMaxGas = 467000;
        it(`should have mint gas cost less then ${mintMaxGas} `, async function () {
            let documentIdentifer = base64ToHex(proof.document_identifier);
            let validRootHash = base64ToHex(proof.document_root);
            let tokenURI = "http://test.com";

            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );

            const tokenId = 1;


            let fields = [
                [
                    stringToByte32(proof.field_proofs[0].value),
                    base64ToHex(proof.field_proofs[0].salt),
                    proof.field_proofs[0].sortedHashes.map(item => base64ToHex(item)),
                ],
                [
                    stringToByte32(proof.field_proofs[1].value),
                    base64ToHex(proof.field_proofs[1].salt),
                    proof.field_proofs[1].sortedHashes.map(item => base64ToHex(item)),
                ],

                [
                    stringToByte32(proof.field_proofs[2].value),
                    base64ToHex(proof.field_proofs[2].salt),
                    proof.field_proofs[2].sortedHashes.map(item => base64ToHex(item)),
                ]
            ]


            const mintGasCost = await this.registry.methods.mint(
                accounts[2],
                tokenId,
                tokenURI,
                documentIdentifer,
                validRootHash,
                fields
            ).estimateGas(transationOptions);

            console.log('Actual mint gas cost:', mintGasCost)
            assert.isBelow(mintGasCost, mintMaxGas, `Gas Price for mint is to high`)
        })


    });


});

