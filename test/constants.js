const {bufferToHex, sha256}  = require("ethereumjs-util");

module.exports = {
    MANAGEMENT: 1,
    ACTION: 2,
    CLAIM: 3,
    ENCRYPTION: 3,
    P2P_IDENTITY: bufferToHex(sha256('CENTRIFUGE@P2P_DISCOVERY')),
    P2P_SIGNATURE: bufferToHex(sha256('CENTRIFUGE@SIGNING')),
    ETH_PREFIX: "\x19Ethereum Signed Message:\n32"
};

