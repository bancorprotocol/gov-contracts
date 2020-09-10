// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IExecutor {
    function execute(
        uint _id,
        uint _for,
        uint _against,
        uint _quorum
    )
    external;
}