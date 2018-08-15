const createRandomByte = require('./tools/random').createRandomByte;
const assertEvent = require('./tools/contractEvents').assertEvent;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const shouldReturnWithMessage = require('./tools/assertTx').shouldReturnWithMessage;

let Identity = artifacts.require("Identity");
let identityRecord;

contract("Identity", function (accounts) {

  describe("Identity Creation", async function () {

    it("should create identity", async function () {
      let centrifugeId = createRandomByte(6);

      let instance = await Identity.new(centrifugeId);
      let readCentrifugeId = web3.toHex(await instance.centrifugeId.call());

      assert.equal(accounts[0], await instance.owner.call(), "The owner of the contract should be the owner address.");
      assert.equal(readCentrifugeId, centrifugeId, "The centrifugeId stored should be the same as passed.");
    });

    it("should not create identity if centrifugeId is 0x0, null, empty", async function () {
      let centrifugeId = 0x0;

      await shouldRevert(Identity.new(centrifugeId));

      centrifugeId = null;
      await shouldReturnWithMessage(Identity.new(centrifugeId),"Identity contract constructor expected 1 arguments, received 0");

      centrifugeId = "";
      await shouldRevert(Identity.new(centrifugeId));
    });

  });
  
  describe("Should Validate a signature", async function () {
      before(async function () {
          identityRecord = await Identity.new(createRandomByte(6));
      });
    it("should validate a signature", async function(){
      await identityRecord.addKey(accounts[1],[3]);
      const toSign = createRandomByte(32);
      console.log(accounts);
      const signature = await web3.eth.sign(accounts[1],toSign);
      const isSignatureValid = await identityRecord.isSignatureValid(toSign, accounts[1] , signature);
      console.log(isSignatureValid);
      assert.equal(isSignatureValid, true);
    })
      
  })

});