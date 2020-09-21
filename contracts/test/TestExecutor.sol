// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "../interfaces/IExecutor.sol";

contract TestExecutor is IExecutor {
    event Executed(uint256 indexed _id, uint256 _for, uint256 _against, uint256 _quorum);

    function execute(
        uint256 _id,
        uint256 _for,
        uint256 _against,
        uint256 _quorum
    ) external override {
        emit Executed(_id, _for, _against, _quorum);
    }
}
