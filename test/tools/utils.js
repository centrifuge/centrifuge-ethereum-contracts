const {bufferToHex, toBuffer,setLengthLeft} = require('ethereumjs-util');

const bytesToBytesN = (input, len) => {
    let offset = (((typeof input) == "string") && input.startsWith("0x")) ? 2 : 0;
    if (input.length > ((len*2)+offset)) {
        return "0x"
    }
    return bufferToHex(setLengthLeft(toBuffer(input),len));
};

module.exports = {
    bytesToBytesN: bytesToBytesN,
    addressToBytes32: (address) => {
        return bytesToBytesN(address, 32);
    }
};

