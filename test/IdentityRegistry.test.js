const createRandomByte = require('./tools/random').createRandomByte;
const assertEvent = require('./tools/contractEvents').assertEvent;
const shouldRevert = require('./tools/assertTx').shouldRevert;

let IdentityRegistry = artifacts.require("IdentityRegistry");

let identityRegistryContract;

contract("IdentityRegistry", function (accounts) {
  before(async function () {
    identityRegistryContract = await IdentityRegistry.deployed();
  });

  describe("Register Identity", async function () {

    it("should register identity", async function () {
      let centrifugeId = createRandomByte(6);
      let contractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a678c;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress).then(function(tx){
        assertEvent(tx, "IdentityRegistered", {centrifugeId: centrifugeId, identity: contractAddress},{centrifugeId:(value) => web3.toHex(value)});
      });

    });

    it("should not register identity if function arguments are malformed", async function () {
      let centrifugeId = "";
      let contractAddress = "";

      await shouldRevert(identityRegistryContract.registerIdentity(centrifugeId, contractAddress));

      centrifugeId = 0x0;
      contractAddress = 0x0;

      await shouldRevert(identityRegistryContract.registerIdentity(centrifugeId, contractAddress));

      centrifugeId = null;
      contractAddress = 0x0;

      await shouldRevert(identityRegistryContract.registerIdentity(centrifugeId, contractAddress));

    });

    it("should not register identity if centrifugeId already exists", async function () {
      let centrifugeId = createRandomByte(6);
      let contractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a678c;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress).then(function(tx){
        assertEvent(tx, "IdentityRegistered", {centrifugeId: centrifugeId, identity: contractAddress}, {centrifugeId:(value) => web3.toHex(value)});
      });

      await shouldRevert(identityRegistryContract.registerIdentity(centrifugeId, contractAddress));

    });

  });

  describe("Update Identity Address", async function () {

    it("should update identity address with same owner", async function () {
      let centrifugeId = createRandomByte(6);
      let contractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a678c;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress).then(function(tx){
        assertEvent(tx, "IdentityRegistered", {centrifugeId: centrifugeId, identity: contractAddress},{centrifugeId:(value) => web3.toHex(value)});
      });

      let newContractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a6669;
      await identityRegistryContract.updateIdentityAddress(centrifugeId, newContractAddress).then(function(tx){
        assertEvent(tx, "IdentityUpdated", {centrifugeId: centrifugeId, identity: newContractAddress},{centrifugeId:(value) => web3.toHex(value)});
      });

    });

    it("should not update identity address with different owner", async function () {
      let centrifugeId = createRandomByte(6);
      let contractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a678c;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress, { from: accounts[0] }).then(function(tx){
        assertEvent(tx, "IdentityRegistered", {centrifugeId: centrifugeId, identity: contractAddress}, {centrifugeId:(value) => web3.toHex(value)});
      });

      let newContractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a6669;
      await shouldRevert(identityRegistryContract.updateIdentityAddress(centrifugeId, newContractAddress, { from: accounts[1] }));

    });

    it("should not update identity with malformed arguments", async function () {
      let centrifugeId = createRandomByte(6);
      let contractAddress = 0x0;

      await shouldRevert(identityRegistryContract.updateIdentityAddress(centrifugeId, contractAddress));

    });

  });

  describe("Retrieve Identity Address", async function () {

    it("should retrieve identity address from centrifuge id by anyone", async function () {
      let centrifugeId = createRandomByte(6);
      let contractAddress = 0xd78703537f7b70ff465dd7afeb4118c0560a678c;

      await identityRegistryContract.registerIdentity(centrifugeId, contractAddress, { from: accounts[0] }).then(function(tx){
        assertEvent(tx, "IdentityRegistered", {centrifugeId: centrifugeId, identity: contractAddress},{centrifugeId:(value) => web3.toHex(value)});
      });

      await identityRegistryContract.getIdentityByCentrifugeId.call(centrifugeId, { from: accounts[1] }).then(function(result){
        assert.equal(result, contractAddress, "Get Identity should return same as stored");
      });
    });

    it("should return 0x0 if identity not found", async function () {
      let centrifugeId = createRandomByte(6);

      await identityRegistryContract.getIdentityByCentrifugeId.call(centrifugeId).then(function(result){
        assert.equal(result, 0x0, "not found identity should return 0x0")
      });
    });

  });

});