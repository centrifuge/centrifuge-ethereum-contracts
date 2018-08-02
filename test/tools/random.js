module.exports = {
    createRandomByte32: function () {
        let identifier = '';
        for (var i = 0; i < 64; i++) {
            identifier += Math.floor(Math.random() * 16).toString(16)
        }
        return '0x' + identifier
    },
    createRandomUint: function (minBits = 0 ,bits = 256 ) {
        if(!Number.isInteger(bits) || bits % 8 !== 0 || bits >256 ) throw new Error('Bits must be an integer multiple of 8 and has a max value of 256 : 8,16,24,...256')
        if(minBits && (!Number.isInteger(bits) || minBits % 8 !== 0 || minBits >258 )) throw new Error('minBits must be an integer multiple of 8 and has a max value of 248 : 8,16,24,...248')
        let min = Math.pow(2,minBits);
        let max = Math.pow(2,bits);
        return Math.floor(Math.random() * (max - min) + min);

    },

    createRandomByte: function(max = 32) {
        let identifier = '';
        for (var i = 0; i < max*2; i++) {
            identifier += Math.floor(Math.random() * 16).toString(16)
        }
        return '0x' + identifier
    }
}


