before(function() {
    // solidity removes leading 0s from uints
    // and we get random test fails
    // Make sure the random hex generator does not generated leading 0 hexes
    const randomHex = web3.utils.randomHex;
    web3.utils.randomHex = (size) => {
        let r = randomHex(size);
        while (r.match(/^0x0/)) {
            r = randomHex(size);
        }
        return r;
    }
});
