module.exports = {
    createRandomByte32: function () {
        let identifier = '';
        for (var i = 0; i < 64; i++) {
            identifier += Math.floor(Math.random() * 16).toString(16)
        }
        return '0x' + identifier
    }
}
