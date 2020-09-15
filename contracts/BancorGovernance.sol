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

contract BancorGovernance is Owned {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event NewProposal(
        uint256 indexed id,
        address creator,
        uint256 start,
        uint256 duration,
        address executor
    );
    event ProposalFinished(
        uint256 indexed id,
        uint256 _for,
        uint256 _against,
        bool quorumReached
    );
    event ProposalExecuted(uint256 indexed id, address executor);
    event Vote(
        uint256 indexed id,
        address indexed voter,
        bool vote,
        uint256 weight
    );
    event RevokeVoter(address indexed voter, uint256 votes, uint256 totalVotes);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    struct Proposal {
        uint256 id;
        address proposer;
        mapping(address => uint256) forVotes;
        mapping(address => uint256) againstVotes;
        uint256 totalForVotes;
        uint256 totalAgainstVotes;
        uint256 start; // block start;
        uint256 end; // start + votePeriod
        address executor;
        string hash;
        uint256 totalVotesAvailable;
        uint256 quorum;
        uint256 quorumRequired;
        bool open;
    }

    /***********************************
     * Vote
     ***********************************/
    /* vote token setup */
    IERC20 public voteToken;

    /* period that your stake it locked to keep it for voting */
    mapping(address => uint256) public voteLocks;
    /* votes of an address */
    mapping(address => uint256) private votes;
    /* is address voter? */
    mapping(address => bool) public voters;

    /***********************************
     * Proposal
     ***********************************/
    /* voting period in blocks ~ 17280 3 days for 15s/block */
    uint256 public votePeriod = 17280;
    /* vote lock in blocks ~ 17280 3 days for 15s/block */
    uint256 public voteLock = 17280;
    /* minimum stake required */
    uint256 public voteMinimum = 1e18;
    /* quorum needed for a proposal to pass */
    uint256 public quorum = 2000;
    /* sum of current total votes */
    uint256 public totalVotes;
    /* number of proposals */
    uint256 public proposalCount;
    /* the proposals */
    mapping(uint256 => Proposal) public proposals;

    /**
     * @dev Only allow voters to call methods flagged with this modifier
     */
    modifier onlyVoter() {
        require(voters[msg.sender] == true, "ERR_NOT_VOTER");
        _;
    }

    /**
     * @dev Only allow stakers to call methods flagged with this modifier
     */
    modifier onlyStaker() {
        require(votes[msg.sender] > 0, "ERR_NOT_STAKER");
        _;
    }

    constructor(address _voteTokenAddress) public {
        voteToken = IERC20(_voteTokenAddress);
    }

    /**
     * @dev Get the stats of a proposal
     * @param id The id of the proposal to get the stats of
     * @return _for For votes ratio
     * @return _against Against votes ratio
     * @return _quorum Quorum ratio
     */
    function getStats(uint256 id)
        public
        view
        returns (
            uint256 _for,
            uint256 _against,
            uint256 _quorum
        )
    {
        _for = proposals[id].totalForVotes;
        _against = proposals[id].totalAgainstVotes;

        // calculate overall total votes
        uint256 _total = _for.add(_against);

        // calculate for votes ratio
        _for = _for.mul(10000).div(_total);
        // calculate against votes ratio
        _against = _against.mul(10000).div(_total);
        // calculate quorum ratio
        _quorum = _total.mul(10000).div(proposals[id].totalVotesAvailable);
    }

    /**
     * @dev Get the voting power of an address
     * @return votes of given address
     */
    function votesOf(address voter) public view returns (uint256) {
        return votes[voter];
    }

    /**
     * @dev Exit this contract and remove all the stake
     */
    function exit() external {
        unstake(votesOf(msg.sender));
    }

    /**
     * @dev Set quorum needed for proposals to pass
     * @param _quorum The required quorum
     */
    function setQuorum(uint256 _quorum) public ownerOnly {
        quorum = _quorum;
    }

    /**
     * @dev Set required votes needed to propose
     * @param _voteMinimum The required minimum votes
     */
    function setVoteMinimum(uint256 _voteMinimum) public ownerOnly {
        voteMinimum = _voteMinimum;
    }

    /**
     * @dev Set period of proposals run
     * @param _votePeriod The vote period
     */
    function setVotePeriod(uint256 _votePeriod) public ownerOnly {
        votePeriod = _votePeriod;
    }

    /**
     * @dev Set period tokens being locked after voting
     * @param _voteLock The vote lock
     */
    function setVoteLock(uint256 _voteLock) public ownerOnly {
        voteLock = _voteLock;
    }

    /**
     * @dev Create a new proposal
     * @param executor The address of the contract to execute when the proposal passes
     * @param hash The ipfs hash holding the description of the proposal
     */
    function propose(address executor, string memory hash) public {
        require(votesOf(msg.sender) > voteMinimum, "ERR_NOT_VOTE_MINIMUM");
        // create new proposal
        proposals[++proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            totalForVotes: 0,
            totalAgainstVotes: 0,
            start: block.number,
            end: votePeriod.add(block.number),
            executor: executor,
            hash: hash,
            totalVotesAvailable: totalVotes,
            quorum: 0,
            quorumRequired: quorum,
            open: true
        });
        // emit proposal event
        emit NewProposal(
            proposalCount,
            msg.sender,
            block.number,
            votePeriod,
            executor
        );
        // lock proposer
        voteLocks[msg.sender] = voteLock.add(block.number);
    }

    /**
     * @dev Execute a proposal
     * @param id The id of the proposal to execute
     */
    function execute(uint256 id) public {
        // get voting info of proposal
        (uint256 _for, uint256 _against, uint256 _quorum) = getStats(id);
        // check proposal state
        require(proposals[id].quorumRequired < _quorum, "ERR_NO_QUORUM");
        require(proposals[id].end < block.number, "ERR_NOT_ENDED");
        require(proposals[id].open, "ERR_NOT_OPEN");
        // tally votes
        tallyVotes(id);
        // do execution on the contract to be executed
        IExecutor(proposals[id].executor).execute(id, _for, _against, _quorum);
        // emit proposal executed event
        emit ProposalExecuted(id, proposals[id].executor);
    }

    /**
     * @dev Tally votes of proposal with given id
     * @param id The id of the proposal to tally votes
     */
    function tallyVotes(uint256 id) public {
        require(proposals[id].open, "ERR_NOT_OPEN");
        require(proposals[id].end < block.number, "ERR_NOT_ENDED");

        // get voting info of proposal
        (uint256 _for, uint256 _against, ) = getStats(id);
        // assume we have no quorum
        bool _quorum = false;
        // do we have a quorum?
        if (proposals[id].quorum >= proposals[id].quorumRequired) {
            _quorum = true;
        }
        // close proposal
        proposals[id].open = false;
        // emit proposal finished event
        emit ProposalFinished(id, _for, _against, _quorum);
    }

    /**
     * @dev Revoke votes
     */
    function revoke() public onlyVoter {
        voters[msg.sender] = false;
        if (totalVotes < votesOf(msg.sender)) {
            // edge case, should be impossible, but this is defi
            totalVotes = 0;
        } else {
            totalVotes = totalVotes.sub(votes[msg.sender]);
        }
        emit RevokeVoter(msg.sender, votesOf(msg.sender), totalVotes);
        votes[msg.sender] = 0;
    }

    /**
     * @dev Vote for a proposal
     * @param id The id of the proposal to vote for
     */
    function voteFor(uint256 id) public onlyStaker {
        require(proposals[id].start > 0, "ERR_NO_PROPOSAL");
        require(proposals[id].start < block.number, "ERR_NOT_STARTED");
        require(proposals[id].end > block.number, "ERR_ENDED");

        // mark sender as voter
        voters[msg.sender] = true;

        // get against votes for this sender
        uint256 _against = proposals[id].againstVotes[msg.sender];
        // do we have against votes for this sender?
        if (_against > 0) {
            // yes, remove the against votes first
            proposals[id].totalAgainstVotes = proposals[id]
                .totalAgainstVotes
                .sub(_against);
            proposals[id].againstVotes[msg.sender] = 0;
        }

        // calculate voting power in case voting for twice
        uint256 vote = votesOf(msg.sender).sub(
            proposals[id].forVotes[msg.sender]
        );
        // increase total for votes of the proposal
        proposals[id].totalForVotes = proposals[id].totalForVotes.add(vote);
        // set for votes to the votes of the sender
        proposals[id].forVotes[msg.sender] = votesOf(msg.sender);
        // update total votes available on the proposal
        proposals[id].totalVotesAvailable = totalVotes;
        // calculate overall votes
        uint256 _votes = proposals[id].totalForVotes.add(
            proposals[id].totalAgainstVotes
        );
        // recalculate quorum based on overall votes
        proposals[id].quorum = _votes.mul(10000).div(totalVotes);
        // lock sender
        voteLocks[msg.sender] = voteLock.add(block.number);
        // emit vote event
        emit Vote(id, msg.sender, true, vote);
    }

    /**
     * @dev Vote against a proposal
     * @param id The id of the proposal to vote against
     */
    function voteAgainst(uint256 id) public onlyStaker {
        require(proposals[id].start > 0, "ERR_NO_PROPOSAL");
        require(proposals[id].start < block.number, "ERR_NOT_STARTED");
        require(proposals[id].end > block.number, "ERR_ENDED");

        // mark sender as voter
        voters[msg.sender] = true;

        // get against votes for this sender
        uint256 _for = proposals[id].forVotes[msg.sender];
        // do we have for votes for this sender?
        if (_for > 0) {
            proposals[id].totalForVotes = proposals[id].totalForVotes.sub(_for);
            proposals[id].forVotes[msg.sender] = 0;
        }

        // calculate voting power in case voting against twice
        uint256 vote = votesOf(msg.sender).sub(
            proposals[id].againstVotes[msg.sender]
        );
        // increase total against votes of the proposal
        proposals[id].totalAgainstVotes = proposals[id].totalAgainstVotes.add(
            vote
        );
        // set against votes to the votes of the sender
        proposals[id].againstVotes[msg.sender] = votesOf(msg.sender);
        // update total votes available on the proposal
        proposals[id].totalVotesAvailable = totalVotes;
        // calculate overall votes
        uint256 _votes = proposals[id].totalForVotes.add(
            proposals[id].totalAgainstVotes
        );
        // recalculate quorum based on overall votes
        proposals[id].quorum = _votes.mul(10000).div(totalVotes);
        // lock sender
        voteLocks[msg.sender] = voteLock.add(block.number);
        // emit vote event
        emit Vote(id, msg.sender, false, vote);
    }

    /**
     * @dev Stake with vote tokens
     * @param amount The amount of vote tokens to stake
     */
    function stake(uint256 amount) public {
        require(amount > 0, "ERR_STAKE_ZERO");

        // increase vote power
        votes[msg.sender] = votesOf(msg.sender).add(amount);
        // increase total votes
        totalVotes = totalVotes.add(amount);
        // transfer tokens to this contract
        voteToken.safeTransferFrom(msg.sender, address(this), amount);
        // emit staked event
        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Unstake staked vote tokens
     * @param amount The amount of vote tokens to unstake
     */
    function unstake(uint256 amount) public {
        require(amount > 0, "ERR_UNSTAKE_ZERO");
        require(voteLocks[msg.sender] < block.number, "ERR_LOCKED");

        // reduce votes for user
        votes[msg.sender] = votesOf(msg.sender).sub(amount);
        // reduce total votes
        totalVotes = totalVotes.sub(amount);
        // transfer tokens back
        voteToken.safeTransfer(msg.sender, amount);
        // emit unstaked event
        emit Unstaked(msg.sender, amount);
    }
}
