// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract Migrations {
    address public owner = msg.sender;
    /* solhint-disable-next-line */
    uint public last_completed_migration;

    modifier restricted() {
        /* solhint-disable-next-line */
        require(
            msg.sender == owner,
            "This function is restricted to the contract's owner"
        );
        _;
    }

    function setCompleted(uint completed) public restricted {
        last_completed_migration = completed;
    }
}
