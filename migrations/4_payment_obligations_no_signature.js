const AnchorRepository = artifacts.require("AnchorRepository");
const PaymentObligation = artifacts.require("PaymentObligation");

module.exports = function (deployer, network) {
    // Redeploy PaymentObligation to rinkeby and kovan
    return AnchorRepository.deployed().then(() => {
        if(network == 'rinkeby' || network == 'kovan')
            return deployer.deploy(PaymentObligation, AnchorRepository.address);
    });

};
