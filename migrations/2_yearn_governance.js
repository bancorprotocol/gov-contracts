const YearnGovernance = artifacts.require("YearnGovernance");
const config = require("./config.json")

module.exports = (deployer, network, accounts) => {
    deployer.deploy(
        YearnGovernance,
        config.tokenAddress,
        config.voteAddress
    );
};
