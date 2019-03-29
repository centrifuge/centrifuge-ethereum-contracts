const UtilitiesWrapper = artifacts.require("UtilitiesWrapper");


contract("Utilities", function (accounts) {

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
            console.log(web3.utils.toHex(result));
            assert.equal(web3.utils.toHex(result), payload)

        });


        it('should return a uint256 if payload is larger', async function () {
            const payload = web3.utils.randomHex(52);
            const result = await this.utilities.bytesToUint(payload);
            const toEqual = payload.slice(0, 66);
            assert.equal(web3.utils.toHex(result), toEqual)

        });

        it('should append 0s at the end', async function () {
            const payload = web3.utils.randomHex(10);
            const result = await this.utilities.bytesToUint(payload);
            const toEqual = payload + Array.apply(null, {length: 44}).map(() => "0").join('');
            assert.equal(web3.utils.toHex(result), toEqual)

        });

        it('should return 0x0 ', async function () {
            const payload = "0x000000";
            const result = await this.utilities.bytesToUint(payload);
            assert.equal(web3.utils.toHex(result), "0x0");
        });

    });

    describe("uintToHexStr", async function () {

        it('it should return the same byte32 hex', async function () {
            const payload = web3.utils.randomHex(32);
            const result = await this.utilities.uintToHexStr(payload);
            console.log(result);
            assert.equal("0x" + result.toLowerCase(), payload)

        });

        it('it should return the same 0x65', async function () {
            const payload = 101;
            const result = await this.utilities.uintToHexStr(payload);
            console.log(result);
            assert.equal("0x" + result.toLowerCase(), web3.utils.toHex(payload))

        });

        it('it should return the same 0x0', async function () {
            const payload = 0;
            const result = await this.utilities.uintToHexStr(payload);
            assert.equal("0x" + result.toLowerCase(), web3.utils.toHex(payload))

        });
        it('it should return the same 0x1', async function () {
            const payload = 1;
            const result = await this.utilities.uintToHexStr(payload);
            assert.equal("0x" + result.toLowerCase(), web3.utils.toHex(payload))

        });

        it('it should return the same byte20 hex', async function () {
            const payload = web3.utils.randomHex(20);
            const result = await this.utilities.uintToHexStr(payload);
            assert.equal("0x" + result.toLowerCase(), payload)

        });

    });


});

