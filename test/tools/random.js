module.exports = {
    createRandomByte32: function () {
        let identifier = '';
        for (var i = 0; i < 64; i++) {
            identifier += Math.floor(Math.random() * 16).toString(16)
        }
        return '0x' + identifier
    },
    createRandomByte: function(max = 32) {
        let identifier = '';
        for (var i = 0; i < max*2; i++) {
            //  avoid  a hash that start with 0x0 as web3.toHex  removes it and test may randomly fail
            identifier += Math.floor(Math.random() * 15  + 1).toString(16)
        }
        return '0x' + identifier
    }
}