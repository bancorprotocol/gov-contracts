const BancorGovernance = artifacts.require("BancorGovernance");
const config = require("./config.json")

module.exports = (deployer, network, accounts) => {
    deployer.deploy(
        BancorGovernance,
        config.voteTokenAddress
    );
};
