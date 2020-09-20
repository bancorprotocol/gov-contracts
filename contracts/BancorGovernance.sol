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

/**
 * @title The Bancor Governance Contract
 *
 * Big thanks to synthetix / yearn.finance for the initial version!
 */
contract BancorGovernance is Owned {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct Proposal {
        uint256 id;
        address proposer;
        mapping(address => uint256) votesFor;
        mapping(address => uint256) votesAgainst;
        uint256 totalVotesFor;
        uint256 totalVotesAgainst;
        uint256 start; // block start;
        uint256 end; // start + voteDuration
        address executor;
        string hash;
        uint256 totalVotesAvailable;
        uint256 quorum;
        uint256 quorumRequired;
        bool open;
    }

    /**
     * @notice triggered when a new proposal is created
     *
     * @param _id       proposal id
     * @param _creator  proposal creator
     * @param _start    voting start block
     * @param _duration voting duration
     * @param _executor contract that will exeecute the proposal once it passes
     */
    event NewProposal(
        uint256 indexed _id,
        address _creator,
        uint256 _start,
        uint256 _duration,
        address _executor
    );

    /**
     * @notice triggered when voting on a proposal has ended
     *
     * @param _id               proposal id
     * @param _for              number of votes for the proposal
     * @param _against          number of votes against the proposal
     * @param _quorumReached    true if quorum was reached, false otherwise
     */
    event ProposalFinished(
        uint256 indexed _id,
        uint256 _for,
        uint256 _against,
        bool _quorumReached
    );

    /**
     * @notice triggered when a proposal was successfully executed
     *
     * @param _id       proposal id
     * @param _executor contract that will exeecute the proposal once it passes
     */
    event ProposalExecuted(uint256 indexed _id, address _executor);

    /**
     * @notice triggered when a stake has been added to the contract
     *
     * @param _user     staker address
     * @param _amount   staked amount
     */
    event Staked(address indexed _user, uint256 _amount);

    /**
     * @notice triggered when a stake has been removed from the contract
     *
     * @param _user     staker address
     * @param _amount   unstaked amount
     */
    event Unstaked(address indexed _user, uint256 _amount);

    /**
     * @notice triggered when a user votes on a proposal
     *
     * @param _id       proposal id
     * @param _voter    voter addrerss
     * @param _vote     true if the vote is for the proposal, false otherwise
     * @param _weight   number of votes
     */
    event Vote(
        uint256 indexed _id,
        address indexed _voter,
        bool _vote,
        uint256 _weight
    );

    /**
     * @notice triggered when voter has revoked its votes
     *
     * @param _voter        voter addrerss
     * @param _votes        number of votes
     * @param _totalVotes   global total number of votes
     */
    event VotesRevoked(address indexed _voter, uint256 _votes, uint256 _totalVotes);

    // PROPOSALS

    // voting duration in blocks, 3 days = ~17280 for 15s/block
    uint256 public voteDuration = 17280;
    // vote lock in blocks, 3 days = ~17280 for 15s/block
    uint256 public voteLock = 17280;
    // minimum stake required
    uint256 public voteMinimum = 1e18;
    // quorum needed for a proposal to pass
    uint256 public quorum = 2000;
    // sum of current total votes
    uint256 public totalVotes;
    // number of proposals
    uint256 public proposalCount;
    // proposals by id
    mapping(uint256 => Proposal) public proposals;

    // VOTES
    
    // governance token used for votes
    IERC20 public immutable govToken;

    // lock duration for each voter stake by voter address
    mapping(address => uint256) public voteLocks;
    // number of votes for each user
    mapping(address => uint256) private votes;
    // true for an address that belongs to a voter
    mapping(address => bool) public voters;

    /**
     * @notice used to initialize a new BancorGovernance contract
     *
     * @param _govToken token used to represents votes
     */
    constructor(IERC20 _govToken) public {
        govToken = _govToken;
    }

    /**
     * @notice allows execution by staker only
     */
    modifier onlyStaker() {
        require(votes[msg.sender] > 0, "ERR_NOT_STAKER");
        _;
    }

    /**
     * @notice allows execution by voter only
     */
    modifier onlyVoter() {
        require(voters[msg.sender] == true, "ERR_NOT_VOTER");
        _;
    }

    /**
     * @notice allows execution only when the proposal with given id is open
     *
     * @param _id   proposal id
     */
    modifier proposalNotEnded(uint256 _id) {
        require(
            proposals[_id].start > 0 && proposals[_id].start < block.number,
            "ERR_NO_PROPOSAL"
        );
        require(proposals[_id].open, "ERR_NOT_OPEN");
        require(proposals[_id].end > block.number, "ERR_ENDED");
        _;
    }

    /**
     * @notice allows execution only when the proposal with given id has ended
     *
     * @param _id   proposal id
     */
    modifier proposalEnded(uint256 _id) {
        require(
            proposals[_id].start > 0 && proposals[_id].start < block.number,
            "ERR_NO_PROPOSAL"
        );
        require(proposals[_id].open, "ERR_NOT_OPEN");
        require(proposals[_id].end < block.number, "ERR_NOT_ENDED");
        _;
    }

    /**
     * @notice returns the quorum ratio of a proposal
     *
     * @param _id   proposal id
     * @return quorum ratio
     */
    function calculateQuorumRatio(uint256 _id) internal view returns (uint256) {
        // calculate overall votes
        uint256 totalProposalVotes = proposals[_id].totalVotesFor.add(
            proposals[_id].totalVotesAgainst
        );

        return totalProposalVotes.mul(10000).div(totalVotes);
    }

    /**
     * @notice removes the caller's entire stake
     */
    function exit() external {
        unstake(votesOf(msg.sender));
    }

    /**
     * @notice returns the voting stats of a proposal
     *
     * @param _id   proposal id
     * @return votes for ratio
     * @return votes against ratio
     * @return quorum ratio
     */
    function proposalStats(uint256 _id) public view returns (uint256, uint256, uint256) {
        uint256 forRatio = proposals[_id].totalVotesFor;
        uint256 againstRatio = proposals[_id].totalVotesAgainst;

        // calculate overall total votes
        uint256 totalProposalVotes = forRatio.add(againstRatio);
        // calculate for votes ratio
        forRatio = forRatio.mul(10000).div(totalProposalVotes);
        // calculate against votes ratio
        againstRatio = againstRatio.mul(10000).div(totalProposalVotes);
        // calculate quorum ratio
        uint256 quorumRatio = totalProposalVotes.mul(10000).div(proposals[_id].totalVotesAvailable);

        return (forRatio, againstRatio, quorumRatio);
    }

    /**
     * @notice returns the voting power of a given address
     *
     * @param _voter    voter address
     * @return votes of given address
     */
    function votesOf(address _voter) public view returns (uint256) {
        return votes[_voter];
    }

    /**
     * @notice updates the quorum needed for proposals to pass
     *
     * @param _quorum required quorum
     */
    function setQuorum(uint256 _quorum) public ownerOnly {
        quorum = _quorum;
    }

    /**
     * @notice updates the required votes needed to propose
     *
     * @param _voteMinimum required minimum votes
     */
    function setVoteMinimum(uint256 _voteMinimum) public ownerOnly {
        voteMinimum = _voteMinimum;
    }

    /**
     * @notice updates the proposals voting duration
     *
     * @param _voteDuration vote duration
     */
    function setVoteDuration(uint256 _voteDuration) public ownerOnly {
        voteDuration = _voteDuration;
    }

    /**
     * @notice updates the post vote lock duration
     *
     * @param _voteLock vote lock
     */
    function setVoteLock(uint256 _voteLock) public ownerOnly {
        voteLock = _voteLock;
    }

    /**
     * @notice creates a new proposal
     *
     * @param _executor the address of the contract that will execute the proposal after it passes
     * @param _hash ipfs hash of the proposal description
     */
    function propose(address _executor, string memory _hash) public {
        require(votesOf(msg.sender) > voteMinimum, "ERR_NOT_VOTE_MINIMUM");

        // create new proposal
        proposals[++proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            totalVotesFor: 0,
            totalVotesAgainst: 0,
            start: block.number,
            end: voteDuration.add(block.number),
            executor: _executor,
            hash: _hash,
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
            voteDuration,
            _executor
        );

        // lock proposer
        voteLocks[msg.sender] = voteLock.add(block.number);
    }

    /**
     * @notice executes a proposal
     *
     * @param _id id of the proposal to execute
     */
    function execute(uint256 _id) public proposalEnded(_id) {
        // get voting info of proposal
        (uint256 forRatio, uint256 againstRatio, uint256 quorumRatio) = proposalStats(_id);
        // check proposal state
        require(proposals[_id].quorumRequired < quorumRatio, "ERR_NO_QUORUM");

        // tally votes
        tallyVotes(_id);
        // do execution on the contract to be executed
        IExecutor(proposals[_id].executor).execute(_id, forRatio, againstRatio, quorumRatio);

        // emit proposal executed event
        emit ProposalExecuted(_id, proposals[_id].executor);
    }

    /**
     * @notice tallies votes of proposal with given id
     *
     * @param _id id of the proposal to tally votes for
     */
    function tallyVotes(uint256 _id) public proposalEnded(_id) {
        // get voting info of proposal
        (uint256 forRatio, uint256 againstRatio,) = proposalStats(_id);
        // assume we have no quorum
        bool quorumReached = false;
        // do we have a quorum?
        if (proposals[_id].quorum >= proposals[_id].quorumRequired) {
            quorumReached = true;
        }

        // close proposal
        proposals[_id].open = false;

        // emit proposal finished event
        emit ProposalFinished(_id, forRatio, againstRatio,quorumReached);
    }

    /**
     * @notice stakes vote tokens
     *
     * @param _amount amount of vote tokens to stake
     */
    function stake(uint256 _amount) public {
        require(_amount > 0, "ERR_STAKE_ZERO");

        // increase vote power
        votes[msg.sender] = votesOf(msg.sender).add(_amount);
        // increase total votes
        totalVotes = totalVotes.add(_amount);
        // transfer tokens to this contract
        govToken.safeTransferFrom(msg.sender, address(this), _amount);

        // emit staked event
        emit Staked(msg.sender, _amount);
    }

    /**
     * @notice unstakes vote tokens
     *
     * @param _amount amount of vote tokens to unstake
     */
    function unstake(uint256 _amount) public {
        require(_amount > 0, "ERR_UNSTAKE_ZERO");
        require(voteLocks[msg.sender] < block.number, "ERR_LOCKED");

        // reduce votes for user
        votes[msg.sender] = votesOf(msg.sender).sub(_amount);
        // reduce total votes
        totalVotes = totalVotes.sub(_amount);
        // transfer tokens back
        govToken.safeTransfer(msg.sender, _amount);

        // emit unstaked event
        emit Unstaked(msg.sender, _amount);
    }

    /**
     * @notice votes for a proposal
     *
     * @param _id id of the proposal to vote for
     */
    function voteFor(uint256 _id) public onlyStaker proposalNotEnded(_id) {
        // mark sender as voter
        voters[msg.sender] = true;

        // get against votes for this sender
        uint256 votesAgainst = proposals[_id].votesAgainst[msg.sender];
        // do we have against votes for this sender?
        if (votesAgainst > 0) {
            // yes, remove the against votes first
            proposals[_id].totalVotesAgainst = proposals[_id].totalVotesAgainst.sub(votesAgainst);
            proposals[_id].votesAgainst[msg.sender] = 0;
        }

        // calculate voting power in case voting for twice
        uint256 vote = votesOf(msg.sender).sub(proposals[_id].votesFor[msg.sender]);

        // increase total for votes of the proposal
        proposals[_id].totalVotesFor = proposals[_id].totalVotesFor.add(vote);
        // set for votes to the votes of the sender
        proposals[_id].votesFor[msg.sender] = votesOf(msg.sender);
        // update total votes available on the proposal
        proposals[_id].totalVotesAvailable = totalVotes;
        // recalculate quorum based on overall votes
        proposals[_id].quorum = calculateQuorumRatio(_id);
        // lock sender
        voteLocks[msg.sender] = voteLock.add(block.number);

        // emit vote event
        emit Vote(_id, msg.sender, true, vote);
    }

    /**
     * @notice votes against a proposal
     *
     * @param _id id of the proposal to vote against
     */
    function voteAgainst(uint256 _id) public onlyStaker proposalNotEnded(_id) {
        // mark sender as voter
        voters[msg.sender] = true;

        // get against votes for this sender
        uint256 votesFor = proposals[_id].votesFor[msg.sender];
        // do we have for votes for this sender?
        if (votesFor > 0) {
            proposals[_id].totalVotesFor = proposals[_id].totalVotesFor.sub(votesFor);
            proposals[_id].votesFor[msg.sender] = 0;
        }

        // calculate voting power in case voting against twice
        uint256 vote = votesOf(msg.sender).sub(proposals[_id].votesAgainst[msg.sender]);
        // increase total against votes of the proposal
        proposals[_id].totalVotesAgainst = proposals[_id].totalVotesAgainst.add(vote);

        // set against votes to the votes of the sender
        proposals[_id].votesAgainst[msg.sender] = votesOf(msg.sender);
        // update total votes available on the proposal
        proposals[_id].totalVotesAvailable = totalVotes;
        // recalculate quorum based on overall votes
        proposals[_id].quorum = calculateQuorumRatio(_id);
        // lock sender
        voteLocks[msg.sender] = voteLock.add(block.number);

        // emit vote event
        emit Vote(_id, msg.sender, false, vote);
    }

    /**
     * @notice revokes votes
     */
    function revokeVotes() public onlyVoter {
        voters[msg.sender] = false;
        totalVotes = totalVotes.sub(votes[msg.sender]);

        // emit vote revocation event
        emit VotesRevoked(msg.sender, votesOf(msg.sender), totalVotes);
        votes[msg.sender] = 0;
    }
}
