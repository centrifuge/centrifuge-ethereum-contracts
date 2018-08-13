const createRandomByte = require('./tools/random').createRandomByte;
const assertEvent = require('./tools/contractEvents').assertEvent;
const getEventValue = require('./tools/contractEvents').getEventValue;
const shouldRevert = require('./tools/assertTx').shouldRevert;

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
      let centrifugeId = createRandomByte(6);

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
      let centrifugeId = createRandomByte(6);

      let createdAddress;
      await identityFactoryContract.createIdentity(centrifugeId, { from: accounts[1] }).then(function(tx) {
        assertEvent(tx, "IdentityCreated", {centrifugeId: centrifugeId});
        assertEvent(tx, "OwnershipTransferred", {newOwner: accounts[1]});
        createdAddress = getEventValue(tx, "IdentityCreated", "identity");
      });

      await identityRegistryContract.getIdentityByCentrifugeId.call(centrifugeId, { from: accounts[1] }).then(function(result){
        assert.equal(result, createdAddress, "Get Identity should return same as created one");
      });

      await shouldRevert(identityFactoryContract.createIdentity(centrifugeId, { from: accounts[1] }));

    });

    it("should not register identity if arguments malformed", async function () {
      let centrifugeId = "";

      await shouldRevert(identityFactoryContract.createIdentity(centrifugeId));

      centrifugeId = 0x0;
      await shouldRevert(identityFactoryContract.createIdentity(centrifugeId));
    });

  });

});
