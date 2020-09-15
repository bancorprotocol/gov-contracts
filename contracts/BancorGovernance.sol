// SPDX-License-Identifier: MIT

/*
   ____            __   __        __   _
  / __/__ __ ___  / /_ / /  ___  / /_ (_)__ __
 _\ \ / // // _ \/ __// _ \/ -_)/ __// / \ \ /
/___/ \_, //_//_/\__//_//_/\__/ \__//_/ /_\_\
     /___/

* Synthetix: YFIRewards.sol
*
* Docs: https://docs.synthetix.io/
*
*
* MIT License
* ===========
*
* Copyright (c) 2020 Synthetix
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
*/
pragma solidity 0.6.12;

import "@bancor/contracts-solidity/solidity/contracts/utility/Owned.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/IExecutor.sol";

contract BancorGovernance is Owned
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event NewProposal(
        uint indexed id,
        address creator,
        uint start,
        uint duration,
        address executor
    );
    event ProposalFinished(
        uint indexed id,
        uint _for,
        uint _against,
        bool quorumReached
    );
    event Vote(
        uint indexed id,
        address indexed voter,
        bool vote,
        uint weight
    );
    event RevokeVoter(
        address indexed voter,
        uint votes,
        uint totalVotes
    );
    event Staked(
        address indexed user,
        uint256 amount
    );
    event Withdrawn(
        address indexed user,
        uint256 amount
    );

    struct Proposal {
        uint id;
        address proposer;
        mapping(address => uint) forVotes;
        mapping(address => uint) againstVotes;
        uint totalForVotes;
        uint totalAgainstVotes;
        uint start; // block start;
        uint end; // start + votePeriod
        address executor;
        string hash;
        uint totalVotesAvailable;
        uint quorum;
        uint quorumRequired;
        bool open;
    }

    /***********************************
     * Vote
     ***********************************/
    /* vote token setup */
    IERC20 public voteToken;

    mapping(address => uint256) private _balances;
    /* Modifications for proposals */
    mapping(address => uint) public voteLocks; // period that your stake it locked to keep it for voting
    /* votes of an address */
    mapping(address => uint) private votes;
    /* is address voter? */
    mapping(address => bool) public voters;

    /***********************************
     * Proposal
     ***********************************/
    /* period that a proposal is open for voting */
    uint public votePeriod = 17280; // voting period in blocks ~ 17280 3 days for 15s/block
    uint public voteLock = 17280; // vote lock in blocks ~ 17280 3 days for 15s/block
    uint public voteMinimum = 1e18;
    uint public quorum = 2000;
    uint public totalVotes;
    /* number of proposals */
    uint public proposalCount;

    mapping(uint => Proposal) public proposals;

    modifier onlyVoter() {
        require(voters[msg.sender] == true, "!voter");
        _;
    }

    constructor(
        address _voteTokenAddress
    )
        public
    {
        voteToken = IERC20(_voteTokenAddress);
    }

    /**
     * @dev Get the stats of a proposal
     * @param id The id of the proposal to get the stats of
     * @return _for
     * @return _against
     * @return _quorum
     */
    function getStats(
        uint id
    )
        public view
        returns (uint _for, uint _against, uint _quorum)
    {
        _for = proposals[id].totalForVotes;
        _against = proposals[id].totalAgainstVotes;

        uint _total = _for.add(_against);
        _for = _for.mul(10000).div(_total);
        _against = _against.mul(10000).div(_total);

        _quorum = _total.mul(10000).div(proposals[id].totalVotesAvailable);
    }

    function votesOf(
        address voter
    )
        public view
        returns (uint)
    {
        return votes[voter];
    }

    function balanceOf(
        address account
    )
        public view
        returns (uint256)
    {
        return _balances[account];
    }

    function exit()
        external
    {
        withdraw(balanceOf(msg.sender));
    }

    /**
     * @dev Set quorum needed for proposals to pass
     * @param _quorum The required quorum
     */
    function setQuorum(
        uint _quorum
    )
        public
        ownerOnly
    {
        quorum = _quorum;
    }

    function setVoteMinimum(
        uint _voteMinimum
    )
        public
        ownerOnly
    {
        voteMinimum = _voteMinimum;
    }

    function setVotePeriod(
        uint _votePeriod
    )
        public
        ownerOnly
    {
        votePeriod = _votePeriod;
    }

    function setVoteLock(
        uint _voteLock
    )
        public
        ownerOnly
    {
        voteLock = _voteLock;
    }

    /**
     * @dev Create a new proposal
     * @param executor The address of the contract to execute when the proposal passes
     * @param hash ????
     */
    function propose(
        address executor,
        string memory hash
    )
        public
    {
        require(votesOf(msg.sender) > voteMinimum, "<voteMinimum");
        proposals[++proposalCount] = Proposal({
            id : proposalCount,
            proposer : msg.sender,
            totalForVotes : 0,
            totalAgainstVotes : 0,
            start : block.number,
            end : votePeriod.add(block.number),
            executor : executor,
            hash : hash,
            totalVotesAvailable : totalVotes,
            quorum : 0,
            quorumRequired : quorum,
            open : true
        });

        emit NewProposal(proposalCount, msg.sender, block.number, votePeriod, executor);
        voteLocks[msg.sender] = voteLock.add(block.number);
    }

    /**
     * @dev Execute a proposal
     * @param id The id of the proposal to execute
     */
    function execute(
        uint id
    )
        public
    {
        (uint _for, uint _against, uint _quorum) = getStats(id);
        require(proposals[id].quorumRequired < _quorum, "!quorum");
        require(proposals[id].end < block.number, "!end");
        if (proposals[id].open == true) {
            tallyVotes(id);
        }
        IExecutor(proposals[id].executor).execute(id, _for, _against, _quorum);
    }

    function tallyVotes(
        uint id
    )
        public
    {
        require(proposals[id].open == true, "!open");
        require(proposals[id].end < block.number, "!end");

        (uint _for, uint _against,) = getStats(id);
        bool _quorum = false;
        if (proposals[id].quorum >= proposals[id].quorumRequired) {
            _quorum = true;
        }
        proposals[id].open = false;
        emit ProposalFinished(id, _for, _against, _quorum);
    }

    /**
     * @dev Revoke votes
     */
    function revoke()
        public
        onlyVoter
    {
        voters[msg.sender] = false;
        if (totalVotes < votes[msg.sender]) {
            // edge case, should be impossible, but this is defi
            totalVotes = 0;
        } else {
            totalVotes = totalVotes.sub(votes[msg.sender]);
        }
        emit RevokeVoter(msg.sender, votes[msg.sender], totalVotes);
        votes[msg.sender] = 0;
    }

    /**
     * @dev Vote for a proposal
     * @param id The id of the proposal to vote for
     */
    function voteFor(
        uint id
    )
        public
    {
        require(proposals[id].start > 0, "no such proposal");
        require(proposals[id].start < block.number, "<start");
        require(proposals[id].end > block.number, ">end");

        voters[msg.sender] = true;

        uint _against = proposals[id].againstVotes[msg.sender];
        if (_against > 0) {
            proposals[id].totalAgainstVotes = proposals[id].totalAgainstVotes.sub(_against);
            proposals[id].againstVotes[msg.sender] = 0;
        }

        uint vote = votesOf(msg.sender).sub(proposals[id].forVotes[msg.sender]);
        proposals[id].totalForVotes = proposals[id].totalForVotes.add(vote);
        proposals[id].forVotes[msg.sender] = votesOf(msg.sender);

        proposals[id].totalVotesAvailable = totalVotes;
        uint _votes = proposals[id].totalForVotes.add(proposals[id].totalAgainstVotes);
        proposals[id].quorum = _votes.mul(10000).div(totalVotes);

        voteLocks[msg.sender] = voteLock.add(block.number);

        emit Vote(id, msg.sender, true, vote);
    }

    /**
     * @dev Vote against a proposal
     * @param id The id of the proposal to vote against
     */
    function voteAgainst(
        uint id
    )
        public
    {
        require(proposals[id].start > 0, "no such proposal");
        require(proposals[id].start < block.number, "<start");
        require(proposals[id].end > block.number, ">end");

        voters[msg.sender] = true;

        uint _for = proposals[id].forVotes[msg.sender];
        if (_for > 0) {
            proposals[id].totalForVotes = proposals[id].totalForVotes.sub(_for);
            proposals[id].forVotes[msg.sender] = 0;
        }

        uint vote = votesOf(msg.sender).sub(proposals[id].againstVotes[msg.sender]);
        proposals[id].totalAgainstVotes = proposals[id].totalAgainstVotes.add(vote);
        proposals[id].againstVotes[msg.sender] = votesOf(msg.sender);

        proposals[id].totalVotesAvailable = totalVotes;
        uint _votes = proposals[id].totalForVotes.add(proposals[id].totalAgainstVotes);
        proposals[id].quorum = _votes.mul(10000).div(totalVotes);

        voteLocks[msg.sender] = voteLock.add(block.number);

        emit Vote(id, msg.sender, false, vote);
    }

    /**
     * @dev Stake with vote tokens
     * @param amount The amount of vote tokens to stake
     */
    function stake(
        uint256 amount
    )
        public
    {
        require(amount > 0, "Cannot stake 0");

        votes[msg.sender] = votes[msg.sender].add(amount);
        totalVotes = totalVotes.add(amount);

        _balances[msg.sender] = _balances[msg.sender].add(amount);
        voteToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Withdraw staked vote tokens
     * @param amount The amount of vote tokens to withdraw
     */
    function withdraw(
        uint256 amount
    )
        public
    {
        require(amount > 0, "Cannot withdraw 0");

        votes[msg.sender] = votes[msg.sender].sub(amount);
        totalVotes = totalVotes.sub(amount);

        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        voteToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }
}
