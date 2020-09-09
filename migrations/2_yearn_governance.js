const YearnGovernance = artifacts.require("YearnGovernance");
const config = require("./config.json")

module.exports = (deployer, network, accounts) => {
    deployer.deploy(
        YearnGovernance,
        accounts[0],
        config.tokenAddress,
        config.voteAddress
    );
};
