// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "../interfaces/IExecutor.sol";

contract TestExecutor is IExecutor {

    event Executed(
        uint indexed _id,
        uint _for,
        uint _against,
        uint _quorum
    );

    function execute(
        uint _id,
        uint _for,
        uint _against,
        uint _quorum
    )
    external
    override
    {
        emit Executed(_id, _for, _against, _quorum);
    }
}
