const YearnGovernance = artifacts.require("YearnGovernance");

module.exports = function (deployer) {
    deployer.deploy(YearnGovernance);
};
