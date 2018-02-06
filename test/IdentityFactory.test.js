const createRandomByte32 = require('./tools/random').createRandomByte32;
const assertEvent = require('./tools/contractEvents').assertEvent;
const getEventValue = require('./tools/contractEvents').getEventValue;

let IdentityFactory = artifacts.require("IdentityFactory");
let IdentityRegistry = artifacts.require("IdentityRegistry");
let Identity = artifacts.require("Identity");

let identityRegistryContract;
let identityFactoryContract;

contract("IdentityFactory", function (accounts) {

  before(async function () {
    identityRegistryContract = await IdentityRegistry.deployed();
    identityFactoryContract = await IdentityFactory.deployed();
  });

  describe("Create Identity", async function () {
    it("should register identity and transfer ownership", async function () {
      let centrifugeId = createRandomByte32();

      let createdAddress;
      await identityFactoryContract.createIdentity(centrifugeId, { from: accounts[1] }).then(function(tx) {
        assertEvent(tx, "IdentityCreated", {centrifugeId: centrifugeId});
        assertEvent(tx, "OwnershipTransferred", {newOwner: accounts[1]});
        createdAddress = getEventValue(tx, "IdentityCreated", "identity");
      });

      await identityRegistryContract.getIdentityByCentrifugeId.call(centrifugeId, { from: accounts[1] }).then(function(result){
        assert.equal(result, createdAddress, "Get Identity should return same as created one");
      });

    });

    it("should register identity once", async function () {
      let centrifugeId = createRandomByte32();

      let createdAddress;
      await identityFactoryContract.createIdentity(centrifugeId, { from: accounts[1] }).then(function(tx) {
        assertEvent(tx, "IdentityCreated", {centrifugeId: centrifugeId});
        assertEvent(tx, "OwnershipTransferred", {newOwner: accounts[1]});
        createdAddress = getEventValue(tx, "IdentityCreated", "identity");
      });

      await identityRegistryContract.getIdentityByCentrifugeId.call(centrifugeId, { from: accounts[1] }).then(function(result){
        assert.equal(result, createdAddress, "Get Identity should return same as created one");
      });

      await identityFactoryContract.createIdentity(centrifugeId, { from: accounts[1] }).then(function () {
        assert.fail(0, 0, "Should not be able to create identity if already centrifugeId already exists")
      }).catch(function (e) {
        assert.equal(e.message, "VM Exception while processing transaction: revert")
      });

    });

    it("should not register identity if arguments malformed", async function () {
      let centrifugeId = "";

      await identityFactoryContract.createIdentity(centrifugeId).then(function () {
        assert.fail(0, 0, "Should not be able to create identity if arguments malformed")
      }).catch(function (e) {
        assert.equal(e.message, "VM Exception while processing transaction: revert")
      });

      centrifugeId = 0x0;
      await identityFactoryContract.createIdentity(centrifugeId).then(function () {
        assert.fail(0, 0, "Should not be able to create identity if arguments malformed")
      }).catch(function (e) {
        assert.equal(e.message, "VM Exception while processing transaction: revert")
      });

    });

  });

});
