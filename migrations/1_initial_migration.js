var Migrations = artifacts.require("./Migrations.sol");

module.exports = function (deployer) {
    // Do dot run migrations in tests because we deploy the contracts we need in tests
    // Truffle will fail when you use addresses from other migrations
    if(process.env.NODE_ENV === "test") return;
    deployer.deploy(Migrations);
};
