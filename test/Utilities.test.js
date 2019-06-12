const shouldRevert = require('./tools/assertTx').shouldRevert;
const UtilitiesWrapper = artifacts.require("UtilitiesWrapper");
const bytesToBytesN = require('./tools/utils').bytesToBytesN;
const proof = require("./erc721/proof.js");

contract("Utilities", function (accounts) {

    let {
        docDataRoot,
        signature,
        publicKey
    } = proof;

    beforeEach(async function () {
        this.utilities = await UtilitiesWrapper.new();

    });

    describe("extractIndex", async function () {


        it('should return the index if the size is in payload limit', async function () {
            const payload = web3.utils.randomHex(32);
            const cursor = 10;
            const start = 2 + 2 * cursor;
            const end = start + 16;
            const result = await this.utilities.extractIndex(payload, cursor);
            assert.equal(result, "0x" + payload.slice(start, end))

        });


        it('should return a 0 filled result', async function () {
            const payload = "0x0";
            const startFrom = 10;
            const result = await this.utilities.extractIndex(payload, startFrom);
            const toEqual = "0x" + Array.apply(null, {length: 16}).map(() => "0").join('')
            assert.equal(result, toEqual)

        });

        it('should return 0s at the end', async function () {
            const payload = web3.utils.randomHex(10);
            const cursor = 8;
            const start = 2 + 2 * cursor;
            const end = start + 16;
            const result = await this.utilities.extractIndex(payload, cursor);
            const zeros = Array.apply(null, {length: 12}).map(() => "0").join('');
            assert.equal(result, "0x" + payload.slice(start, end) + zeros)

        });

    });

    describe("bytesToUint", async function () {

        it('it should return the same hex', async function () {
            const payload = web3.utils.randomHex(32);
            const result = await this.utilities.bytesToUint(payload);
            console.log(bytesToBytesN(result, 32));
            assert.equal(bytesToBytesN(result, 32), payload)

        });


        it('should return a uint256 if payload is larger', async function () {
            const payload = web3.utils.randomHex(52);
            const result = await this.utilities.bytesToUint(payload);
            const toEqual = payload.slice(0, 66);
            assert.equal(bytesToBytesN(result, 32), toEqual)

        });

        it('should honor the leading 0', async function () {
           const payload = "0x04048d5cc923ce97f9265dcf70f2fea47319c600954f04306a231561712b4693";
           const result = await this.utilities.bytesToUint(payload);
           console.log(bytesToBytesN(result, 32));
            assert.equal(bytesToBytesN(result, 32), payload)
        });

        it('should append 0s at the end', async function () {
            const payload = web3.utils.randomHex(10);
            const result = await this.utilities.bytesToUint(payload);
            const toEqual = payload + Array.apply(null, {length: 44}).map(() => "0").join('');
            assert.equal(bytesToBytesN(result, 32), toEqual)

        });

        it('should return 0x0 ', async function () {
            const payload = "0x000000";
            const result = await this.utilities.bytesToUint(payload);
            assert.equal(bytesToBytesN(result, 3), payload);
        });

    });

    describe("uintToHexStr", async function () {

        it('it should return the same byte32 hex', async function () {
            const payload = web3.utils.randomHex(32);
            const result = await this.utilities.uintToHexStrPadded(payload, 32);
            console.log(result);
            assert.equal("0x" + result.toLowerCase(), payload)

        });

        it('it should return the same 0x65', async function () {
            const payload = 101;
            const result = await this.utilities.uintToHexStrPadded(payload, 1);
            console.log(result);
            assert.equal("0x" + result.toLowerCase(), bytesToBytesN(payload, 1))

        });

        it('it should return the same 0x00', async function () {
            const payload = 0;
            const result = await this.utilities.uintToHexStrPadded(payload, 1);
            console.log(result);
            assert.equal("0x" + result.toLowerCase(), "0x00")

        });
        it('it should return the same 0x01', async function () {
            const payload = 1;
            const result = await this.utilities.uintToHexStrPadded(payload, 1);
            console.log(result);
            assert.equal("0x" + result.toLowerCase(), "0x01")

        });

        it('it should return the same byte20 hex', async function () {
            const payload = web3.utils.randomHex(20);
            const result = await this.utilities.uintToHexStrPadded(payload, 20);
            assert.equal("0x" + result.toLowerCase(), payload)

        });

        it('it should return the address with leading zero', async function () {
            const payload = "0x04048d5cc923ce97f9265dcf70f2fea47319c600";
            const result = await this.utilities.uintToHexStrPadded(payload, 20);
            assert.equal("0x" + result.toLowerCase(), payload)

        });

    });

    describe("recoverPublicKeyFromPayload", async function () {

        it('should fail when signature length is not 66 bytes', async function() {
            const signature = web3.utils.randomHex(65);
            const pk = await this.utilities.recoverPublicKeyFromConsensusSignature(signature, docDataRoot.hash);
            assert.equal(pk, "0x0000000000000000000000000000000000000000000000000000000000000000");
        });

        it('should return the same public key used for signing', async function () {
            const pk = await this.utilities.recoverPublicKeyFromConsensusSignature(signature.value, docDataRoot.hash);
            assert.equal(pk, publicKey);

        });
    });


});

