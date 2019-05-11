const {bufferToHex, toBuffer,setLengthLeft} = require('ethereumjs-util');

module.exports = {
    addressToBytes32: (address) => {
        return bufferToHex(setLengthLeft(toBuffer(address),32));
    },
    addressToBytes20: (address) => {
        return bufferToHex(setLengthLeft(toBuffer(address),20));
    }
};

