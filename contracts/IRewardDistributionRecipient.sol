// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract IRewardDistributionRecipient is Ownable {
    address private rewardDistribution;

    function notifyRewardAmount(uint256 reward) external virtual;

    modifier onlyRewardDistribution() {
        require(
            _msgSender() == rewardDistribution,
            "!rewardDistribution"
        );
        _;
    }

    function setRewardDistribution(address _rewardDistribution)
    external
    onlyOwner
    {
        rewardDistribution = _rewardDistribution;
    }
}