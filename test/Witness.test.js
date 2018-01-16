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
    const signature = createRandomByte32()
    console.log("Dest/Sig:", nextVersion, signature)
        it("should write a signature to the chain", async function  () {
        let witness = await Witness.deployed()
        
        await witness.witnessDocument(version, nextVersion, signature, {from:accounts[0]}).then(function (tx) {
            assert.equal(tx.receipt.status, 1)
            return tx
        }).catch(function (e) {
            throw e
        })
        
        let response = await witness.getWitness.call(version, {from: accounts[0]})
        assert.equal(signature, response[0])
        assert.equal(nextVersion, response[1])

        // Try overwriting an existing signature
        await witness.witnessDocument(version, nextVersion, signature.substr(2), {from:accounts[0]}).then(function (tx) {
            throw "Transaction should not succeed"
        }).catch(function (e) {
            assert.equal(e.message, "VM Exception while processing transaction: revert")
        })

        // Ensure signature hasn't changed
        response = await witness.getWitness.call(version, {from: accounts[0]})
        assert.equal(signature, response[0])
        assert.equal(nextVersion, response[1]) 

        // Try reusing an existing nextVersion
        const newVersion = createRandomByte32()
        await witness.witnessDocument(newVersion, nextVersion, signature.substr(2), {from:accounts[0]}).then(function (tx) {
            throw "Transaction should not succeed"
        }).catch(function (e) {
            assert.equal(e.message, "VM Exception while processing transaction: revert")
        })

        // TODO: Check blocktime
    })
})
