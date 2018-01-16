var Witness = artifacts.require("Witness");

function createRandomByte32() {
    let version = '';
    for (var i = 0; i < 64; i++) {
        version += Math.floor(Math.random()*16).toString(16)
    }
    return '0x'+version
}

contract("Witness", function (accounts) {
    const version = createRandomByte32()
    const nextVersion = createRandomByte32()
    const merkleRoot = createRandomByte32()
    it("should write a merkle root to the chain", async function  () {
        let witness = await Witness.deployed()
        
        await witness.witnessDocument(version, merkleRoot, {from:accounts[0]}).then(function (tx) {
            assert.equal(tx.receipt.status, 1)
            return tx
        }).catch(function (e) {
            throw e
        })
        
        let response = await witness.getWitness.call(version, {from: accounts[0]})
        assert.equal(merkleRoot, response[0])

        // Try overwriting an existing merkleRoot
        await witness.witnessDocument(version, merkleRoot.substr(2), {from:accounts[0]}).then(function (tx) {
            throw "Transaction should not succeed"
        }).catch(function (e) {
            assert.equal(e.message, "VM Exception while processing transaction: revert")
        })

        // Ensure merkleRoot hasn't changed
        response = await witness.getWitness.call(version, {from: accounts[0]})
        assert.equal(merkleRoot, response[0])

        // TODO: Check blocktime
    })
})
