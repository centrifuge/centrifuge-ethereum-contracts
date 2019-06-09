const SignaturesWrapper = artifacts.require("SignaturesWrapper");

contract("Signatures", function (accounts) {

  beforeEach(async function () {
    this.signatures = await SignaturesWrapper.new();

  });

  describe("consensusSignatureToEthSignedMessageHash", async function () {
    it('it should hash 33 bytes', async function () {
      const ddr = web3.utils.randomHex(32);
      const st = "0x00";
      const result = await this.signatures.consensusSignatureToEthSignedMessageHash(ddr, st);
      assert.equal(result.length, 66); // (0x)2 + (32*2) = 66
    })
  });

});