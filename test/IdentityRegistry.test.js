const createRandomByte32 = require('./tools/random').createRandomByte32;
const assertEvent = require('./tools/contractEvents').assertEvent;

let IdentityRegistry = artifacts.require("IdentityRegistry");

let identityRegistryContract;

contract("IdentityRegistry", function (accounts) {
  before(async function () {
    identityRegistryContract = await IdentityRegistry.deployed();
  });

  describe("Register Identity", async function () {

    it("should register identity", async function () {
      let centrifugeId = createRandomByte32();
      let contractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a678c;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress).then(function(tx){
        assertEvent(tx, "IdentityRegistered", {centrifugeId: centrifugeId, identity: contractAddress});
      });

    });

    it("should not register identity if function arguments are malformed", async function () {
      let centrifugeId = "";
      let contractAddress = "";

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress).then(function () {
        assert.fail(0, 0, "Should not be able to register identity with malformed arguments");
      }).catch(function (e) {
        assert.equal(e.message, "VM Exception while processing transaction: revert");
      });

      centrifugeId = 0x0;
      contractAddress = 0x0;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress).then(function () {
        assert.fail(0, 0, "Should not be able to register identity with malformed arguments");
      }).catch(function (e) {
        assert.equal(e.message, "VM Exception while processing transaction: revert");
      });

      centrifugeId = null;
      contractAddress = 0x0;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress).then(function () {
        assert.fail(0, 0, "Should not be able to register identity with malformed arguments");
      }).catch(function (e) {
        assert.equal(e.message, "VM Exception while processing transaction: revert");
      });

    });

    it("should not register identity if centrifugeId already exists", async function () {
      let centrifugeId = createRandomByte32();
      let contractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a678c;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress).then(function(tx){
        assertEvent(tx, "IdentityRegistered", {centrifugeId: centrifugeId, identity: contractAddress});
      });

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress).then(function () {
        assert.fail(0, 0, "Should not be able to register identity if already exists")
      }).catch(function (e) {
        assert.equal(e.message, "VM Exception while processing transaction: revert")
      });

    });

  });

  describe("Update Identity Address", async function () {

    it("should update identity address with same owner", async function () {
      let centrifugeId = createRandomByte32();
      let contractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a678c;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress).then(function(tx){
        assertEvent(tx, "IdentityRegistered", {centrifugeId: centrifugeId, identity: contractAddress});
      });

      let newContractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a6669;
      await identityRegistryContract.updateIdentityAddress(centrifugeId, newContractAddress).then(function(tx){
        assertEvent(tx, "IdentityUpdated", {centrifugeId: centrifugeId, identity: newContractAddress});
      });

    });

    it("should not update identity address with different owner", async function () {
      let centrifugeId = createRandomByte32();
      let contractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a678c;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress, { from: accounts[0] }).then(function(tx){
        assertEvent(tx, "IdentityRegistered", {centrifugeId: centrifugeId, identity: contractAddress});
      });

      let newContractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a6669;
      await identityRegistryContract.updateIdentityAddress(centrifugeId, newContractAddress, { from: accounts[1] }).then(function () {
        assert.fail(0, 0, "Should not be able to update entry that does not belong to owner")
      }).catch(function (e) {
        assert.equal(e.message, "VM Exception while processing transaction: revert")
      });

    });

    it("should not update identity with malformed arguments", async function () {
      let centrifugeId = createRandomByte32();
      let contractAddress = 0x0;

      await identityRegistryContract.updateIdentityAddress(centrifugeId, contractAddress).then(function () {
        assert.fail(0, 0, "Should not be able to update identity with identity as 0x0")
      }).catch(function (e) {
        assert.equal(e.message, "VM Exception while processing transaction: revert")
      });

    });

  });

  describe("Retrieve Identity Address", async function () {

    it("should retrieve identity address from centrifuge id by anyone", async function () {
      let centrifugeId = createRandomByte32();
      let contractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a678c;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress, { from: accounts[0] }).then(function(tx){
        assertEvent(tx, "IdentityRegistered", {centrifugeId: centrifugeId, identity: contractAddress});
      });

      await identityRegistryContract.getIdentityByCentrifugeId.call(centrifugeId, { from: accounts[1] }).then(function(result){
        assert.equal(result, contractAddress, "Get Identity should return same as stored");
      });
    });

    it("should return 0x0 if identity not found", async function () {
      let centrifugeId = createRandomByte32();

      await identityRegistryContract.getIdentityByCentrifugeId.call(centrifugeId).then(function(result){
        assert.equal(result, 0x0, "not found identity should return 0x0")
      });
    });

  });

});