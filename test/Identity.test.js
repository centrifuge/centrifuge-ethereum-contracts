const createRandomByte32 = require('./tools/random').createRandomByte32;
const assertEvent = require('./tools/contractEvents').assertEvent;
const shouldRevert = require('./tools/assertTx').shouldRevert;
const shouldSucceed = require('./tools/assertTx').shouldSucceed;
const shouldReturnWithMessage = require('./tools/assertTx').shouldReturnWithMessage;

let Identity = artifacts.require("Identity");
let identityRecord;

contract("Identity", function (accounts) {

  describe("Identity Creation", async function () {

    it("should create identity", async function () {
      let centrifugeId = createRandomByte32();

      let instance = await Identity.new(centrifugeId);
      let readCentrifugeId = await instance.centrifugeId.call();

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

  describe("Adding/Retrieving Keys", async function () {
    before(async function () {
      identityRecord = await Identity.new(createRandomByte32());
    });

    it("should add and retrieve same key", async function () {
      let keyType = 1;
      let peerToPeerId = createRandomByte32();

      await identityRecord.addKey(peerToPeerId, keyType).then(function(tx){
        assertEvent(tx, "KeyRegistered", {key: peerToPeerId, kType: keyType});
      });

      await identityRecord.getKeysByType.call(keyType).then(function(result){
        assert.equal(result[0], peerToPeerId, "Get Key should return peerToPeer key stored");
      });

    });

    it("should not add a key if type is < 1", async function () {
        let keyType = 0;
        let peerToPeerId = createRandomByte32();

        await shouldRevert(identityRecord.addKey(peerToPeerId, keyType));
    });

    it("should return 0x0 if key not found", async function () {
      let keyType = 0;

      await identityRecord.getKeysByType.call(keyType).then(function (result) {
        assert.equal(result, 0x0, "not found key should return 0x0")
      });
    });

  });

  describe("Updating/Retrieving Keys", async function () {
    before(async function () {
      identityRecord = await Identity.new(createRandomByte32());
    });

    it("should update and retrieve new key", async function () {
      let keyType = 1;
      let peerToPeerId = createRandomByte32();

      await identityRecord.addKey(peerToPeerId, keyType).then(function(tx){
        assertEvent(tx, "KeyRegistered", {key: peerToPeerId, kType: keyType});
      });

      await identityRecord.getKeysByType.call(keyType).then(function(result){
        assert.equal(result[0], peerToPeerId, "Get Key should return peerToPeer key stored");
      });

      let newPeerToPeerId = createRandomByte32();
      await identityRecord.addKey(newPeerToPeerId, keyType).then(function(tx){
        assertEvent(tx, "KeyRegistered", {key: newPeerToPeerId, kType: keyType});
      });

      await identityRecord.getKeysByType.call(keyType).then(function(result){
        assert.equal(result[0], peerToPeerId, "Get Key should not return peerToPeer key stored");
        assert.equal(result[1], newPeerToPeerId, "Second Key should be newPeerToPeer key stored");
      });

    });

  });

});