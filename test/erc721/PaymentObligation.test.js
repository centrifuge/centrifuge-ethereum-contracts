const {bufferToHex, keccak, toBuffer} = require("ethereumjs-util");
let PaymentObligation = artifacts.require("PaymentObligation");
let UserMintableERC721 = artifacts.require("UserMintableERC721");
let MockAnchorRegistry = artifacts.require("MockAnchorRepository");
let IdentityRegistry = artifacts.require("IdentityRegistry");
let Identity = artifacts.require("Identity");
let proof = require('./proof.json');


const shouldRevert = async (promise) => {
    return await shouldReturnWithMessage(promise, "revert");
}

const shouldReturnWithMessage = async (promise, search) => {
    try {
        await promise;
        assert.fail("Expected message not received");
    } catch (error) {
        const revertFound = error.message.search(search) >= 0;
        assert(revertFound, `Expected "${search}", got ${error} instead`);
    }
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
        base64ToHex("EUqfrgLuRdt+ot+3vI9qnCdybeYN3xwwe/MJVsCH2wc="),
        base64ToHex("3hsHx/etwya5rcyIe3Avw2724ThyZl9pS4tMdybn05w="),
        base64ToHex("zlt7lxQcvwpEfh17speU89j/J2xZdAYfSu/JDLujXqA=")
    ];
}

let deployedCentrifugeId = "0x24fe6555beb9";
let deployedIdentity;
let deployedIdentityRegistry;

console.log(base64ToHex("JP5lVb65"));
console.log(base64ToHex(proof.document_root));
console.log(deployedCentrifugeId);
console.log(toBuffer(deployedCentrifugeId).toString('base64'));

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

        it("should mint a token if the Merkle proof validates", async function () {
            let documentIdentifer = "0xce5b7b97141cbf0a447e1d7bb29794f3d8ff276c5974061f4aefc90cbba35eaf";
            //let validRootHash = '0xc6622abbfe4ff0d80fbff1c73fa427ab367ecfc693079e66bdb0d88729526c36'
            let validRootHash = base64ToHex("Hl5ET0xMcnj18xrrQHw4BOfDT3n3K4Q4vmZfjO6TV0Q=");
            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                validRootHash
            );

            let validProof = getValidProofHashes();

            //root hash is 0x1e5e444f4c4c7278f5f31aeb407c3804e7c34f79f72b8438be665f8cee935744 in hex
            let field = proof.field_proofs[1];
            console.log(field.sortedHashes.map(item => base64ToHex(item)));
            console.log(field.property)
            console.log(field.value)
            console.log(base64ToHex(field.salt))
            console.log(validProof)

            await this.registry.mint(
                "0x1",
                1,
                documentIdentifer,
                validRootHash,
                [
                    '0x114a9fae02ee45db7ea2dfb7bc8f6a9c27726de60ddf1c307bf30956c087db07de1b07c7f7adc326b9adcc887b702fc36ef6e13872665f694b8b4c7726e7d39cce5b7b97141cbf0a447e1d7bb29794f3d8ff276c5974061f4aefc90cbba35ea0',
                    '0x114a9fae02ee45db7ea2dfb7bc8f6a9c27726de60ddf1c307bf30956c087db07de1b07c7f7adc326b9adcc887b702fc36ef6e13872665f694b8b4c7726e7d39cce5b7b97141cbf0a447e1d7bb29794f3d8ff276c5974061f4aefc90cbba35ea0'
                ],
                ["Foo","Foo"],
                [base64ToHex("UXfmxueEm0hxx9zzO21HQ5Bwg8Zg64lpQfq1y2r94ys="), base64ToHex("UXfmxueEm0hxx9zzO21HQ5Bwg8Zg64lpQfq1y2r94ys=")]
            );


        });

        /*it("should fail to mint a token if the Merkle proof does not validate", async function () {
            let documentIdentifer = "0xce5b7b97141cbf0a447e1d7bb29794f3d8ff276c5974061f4aefc90cbba35eaf"
            await this.anchorRegistry.setAnchorById(
                documentIdentifer,
                "0x1e5e444f4c4c7278f5f31aeb407c3804e7c34f79f72b8438be665f8cee935744"
            );

            let validProof = getValidProofHashes();

            //root hash is 0x1e5e444f4c4c7278f5f31aeb407c3804e7c34f79f72b8438be665f8cee935744 in hex
            let validRootHash = base64ToHex("Hl5ET0xMcnj18xrrQHw4BOfDT3n3K4Q4vmZfjO6TV0Q=");

            await shouldRevert(
                this.registry.mint(
                    "0x1",
                    1,
                    documentIdentifer,
                    validRootHash,
                    validProof,
                    "valueFAIL",
                    "Foo",
                    base64ToHex("UXfmxueEm0hxx9zzO21HQ5Bwg8Zg64lpQfq1y2r94ys=")
                ));
        });*/
    });


});