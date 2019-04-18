const shouldRevert = async (promise, message) => {
    return await shouldReturnWithMessage(promise, message || 'revert');
};

const shouldReturnWithMessage = async (promise, search) => {
    try {
        await promise;
        assert.fail('Expected message not received');
    } catch (error) {
        const revertFound = error.message.search(search) >= 0;
        assert(revertFound, `Expected "${search}", got ${error} instead`);
    }
};

const shouldSucceed = async (promise) => {
    try {
        const tx = await promise;
        assert.equal(tx.receipt.status, 1);
    } catch (error) {
        assert.fail(`Transaction expected to succeed, , got ${error} instead`)
    }
};


module.exports = {
    shouldReturnWithMessage: shouldReturnWithMessage,
    shouldRevert: shouldRevert,
    shouldSucceed: shouldSucceed
};

