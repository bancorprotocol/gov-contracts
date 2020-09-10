// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@bancor/contracts-solidity/solidity/contracts/utility/Owned.sol";

abstract contract IRewardDistributionRecipient is Owned {
    address public rewardDistribution;

    function notifyRewardAmount(
        uint256 reward
    )
    external
    virtual;

    modifier onlyRewardDistribution() {
        require(
            msg.sender == rewardDistribution,
            "!rewardDistribution"
        );
        _;
    }

    function setRewardDistribution(
        address _rewardDistribution
    )
    external
    ownerOnly
    {
        rewardDistribution = _rewardDistribution;
    }
}