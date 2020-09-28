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

    uint32 internal constant PPM_RESOLUTION = 1000000;

    struct Proposal {
        uint256 id;
        mapping(address => uint256) votesFor;
        mapping(address => uint256) votesAgainst;
        uint256 totalVotesFor;
        uint256 totalVotesAgainst;
        uint256 start; // block start;
        uint256 end; // start + voteDuration
        uint256 totalAvailableVotes;
        uint256 quorum;
        uint256 quorumRequired;
        bool open;
        bool executed;
        address proposer;
        address executor;
        string hash;
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
        uint256 _start,
        uint256 _duration,
        address _creator,
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
     * @param _executor contract that will execute the proposal once it passes
     */
    event ProposalExecuted(uint256 indexed _id, address indexed _executor);

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
    event Vote(uint256 indexed _id, address indexed _voter, bool _vote, uint256 _weight);

    /**
     * @notice triggered when the quorum is updated
     *
     * @param _quorum   the new quorum
     */
    event QuorumUpdated(uint256 _quorum);

    /**
     * @notice triggered when the vote minimum is updated
     *
     * @param _voteMinimumForProposal  the new vote minimum
     */
    event VoteMinimumForProposalUpdated(uint256 _voteMinimumForProposal);

    /**
     * @notice triggered when the vote duration is updated
     *
     * @param _voteDuration the new vote duration
     */
    event VoteDurationUpdated(uint256 _voteDuration);

    /**
     * @notice triggered when the vote lock duration is updated
     *
     * @param _duration the new vote lock duration
     */
    event VoteLockDurationUpdated(uint256 _duration);

    // PROPOSALS

    // voting duration in blocks, 3 days = ~17280 for 15s/block
    uint256 public voteDuration = 17280;
    // vote lock in blocks, 3 days = ~17280 for 15s/block
    uint256 public voteLockDuration = 17280;
    // minimum stake required to propose
    uint256 public voteMinimumForProposal = 1e18;
    // quorum needed for a proposal to pass, default = 20%
    uint256 public quorum = 200000;
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
        require(address(_govToken) != address(0), "ERR_NO_TOKEN");
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
     * @notice allows execution only when the proposal exists
     *
     * @param _id   proposal id
     */
    modifier proposalExists(uint256 _id) {
        Proposal memory proposal = proposals[_id];
        require(proposal.start > 0 && proposal.start < block.number, "ERR_NO_PROPOSAL");
        _;
    }

    /**
     * @notice allows execution only when the proposal is still open
     *
     * @param _id   proposal id
     */
    modifier proposalOpen(uint256 _id) {
        Proposal memory proposal = proposals[_id];
        require(proposal.open, "ERR_NOT_OPEN");
        _;
    }

    /**
     * @notice allows execution only when the proposal with given id is open
     *
     * @param _id   proposal id
     */
    modifier proposalNotEnded(uint256 _id) {
        Proposal memory proposal = proposals[_id];
        require(proposal.end > block.number, "ERR_ENDED");
        _;
    }

    /**
     * @notice allows execution only when the proposal with given id has ended
     *
     * @param _id   proposal id
     */
    modifier proposalEnded(uint256 _id) {
        Proposal memory proposal = proposals[_id];
        require(proposal.end < block.number, "ERR_NOT_ENDED");
        _;
    }

    /**
     * @notice verifies that a value is greater than zero
     *
     * @param _value    value to check for zero
     */
    modifier greaterThanZero(uint256 _value) {
        require(_value > 0, "ERR_ZERO_VALUE");
        _;
    }

    /**
     * @notice Updates the vote lock on the sender
     *
     * @param _proposalEnd  the block number when the proposal ends
     */
    function updateVoteLock(uint256 _proposalEnd) private onlyStaker {
        voteLocks[msg.sender] = Math.max(
            voteLocks[msg.sender],
            Math.max(_proposalEnd, voteLockDuration.add(block.number))
        );
    }

    /**
     * @notice does the common vote finalization
     *
     * @param _proposal the proposal to vote
     * @param _for is this vote for or against the proposal
     */
    function vote(Proposal storage _proposal, bool _for) private onlyStaker {
        // mark sender as voter
        voters[msg.sender] = true;

        if (_for) {
            uint256 votesAgainst = _proposal.votesAgainst[msg.sender];
            // do we have against votes for this sender?
            if (votesAgainst > 0) {
                // yes, remove the against votes first
                _proposal.totalVotesAgainst = _proposal.totalVotesAgainst.sub(votesAgainst);
                _proposal.votesAgainst[msg.sender] = 0;
            }
        } else {
            // get against votes for this sender
            uint256 votesFor = _proposal.votesFor[msg.sender];
            // do we have for votes for this sender?
            if (votesFor > 0) {
                _proposal.totalVotesFor = _proposal.totalVotesFor.sub(votesFor);
                _proposal.votesFor[msg.sender] = 0;
            }
        }

        // calculate voting power in case voting against twice
        uint256 voteAmount = votesOf(msg.sender).sub(
            _for ? _proposal.votesFor[msg.sender] : _proposal.votesAgainst[msg.sender]
        );

        if (_for) {
            // increase total for votes of the proposal
            _proposal.totalVotesFor = _proposal.totalVotesFor.add(voteAmount);
            // set for votes to the votes of the sender
            _proposal.votesFor[msg.sender] = votesOf(msg.sender);
        } else {
            // increase total against votes of the proposal
            _proposal.totalVotesAgainst = _proposal.totalVotesAgainst.add(voteAmount);
            // set against votes to the votes of the sender
            _proposal.votesAgainst[msg.sender] = votesOf(msg.sender);
        }

        // update total votes available on the proposal
        _proposal.totalAvailableVotes = totalVotes;
        // recalculate quorum based on overall votes
        _proposal.quorum = calculateQuorumRatio(_proposal);
        // update vote lock
        updateVoteLock(_proposal.end);

        // emit vote event
        emit Vote(_proposal.id, msg.sender, _for, voteAmount);
    }

    /**
     * @notice returns the quorum ratio of a proposal
     *
     * @param _proposal   proposal
     * @return quorum ratio
     */
    function calculateQuorumRatio(Proposal memory _proposal) internal view returns (uint256) {
        // calculate overall votes
        uint256 totalProposalVotes = _proposal.totalVotesFor.add(_proposal.totalVotesAgainst);

        return totalProposalVotes.mul(PPM_RESOLUTION).div(totalVotes);
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
    function proposalStats(uint256 _id)
        public
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        Proposal memory proposal = proposals[_id];

        uint256 forRatio = proposal.totalVotesFor;
        uint256 againstRatio = proposal.totalVotesAgainst;

        // calculate overall total votes
        uint256 totalProposalVotes = forRatio.add(againstRatio);
        // calculate for votes ratio
        forRatio = forRatio.mul(PPM_RESOLUTION).div(totalProposalVotes);
        // calculate against votes ratio
        againstRatio = againstRatio.mul(PPM_RESOLUTION).div(totalProposalVotes);
        // calculate quorum ratio
        uint256 quorumRatio = totalProposalVotes.mul(PPM_RESOLUTION).div(
            proposal.totalAvailableVotes
        );

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
     * @notice returns the voting power of a given address against a given proposal
     *
     * @param _voter    voter address
     * @param _id       proposal id
     * @return votes of given address against given proposal
     */
    function votesAgainstOf(address _voter, uint256 _id) public view returns (uint256) {
        return proposals[_id].votesAgainst[_voter];
    }

    /**
     * @notice returns the voting power of a given address for a given proposal
     *
     * @param _voter    voter address
     * @param _id       proposal id
     * @return votes of given address for given proposal
     */
    function votesForOf(address _voter, uint256 _id) public view returns (uint256) {
        return proposals[_id].votesFor[_voter];
    }

    /**
     * @notice updates the quorum needed for proposals to pass
     *
     * @param _quorum required quorum
     */
    function setQuorum(uint256 _quorum) public ownerOnly greaterThanZero(_quorum) {
        // check quorum for not being above 100
        require(_quorum / 10000 <= 100, "ERR_QUORUM_TOO_HIGH");

        quorum = _quorum;
        emit QuorumUpdated(_quorum);
    }

    /**
     * @notice updates the required votes needed to propose
     *
     * @param _voteMinimumForProposal required minimum votes
     */
    function setVoteMinimumForProposal(uint256 _voteMinimumForProposal)
        public
        ownerOnly
        greaterThanZero(_voteMinimumForProposal)
    {
        require(_voteMinimumForProposal <= govToken.totalSupply(), "ERR_EXCEEDS_TOTAL_SUPPLY");
        voteMinimumForProposal = _voteMinimumForProposal;
        emit VoteMinimumForProposalUpdated(_voteMinimumForProposal);
    }

    /**
     * @notice updates the proposals voting duration
     *
     * @param _voteDuration vote duration
     */
    function setVoteDuration(uint256 _voteDuration)
        public
        ownerOnly
        greaterThanZero(_voteDuration)
    {
        voteDuration = _voteDuration;
        emit VoteDurationUpdated(_voteDuration);
    }

    /**
     * @notice updates the post vote lock duration
     *
     * @param _duration new vote lock duration
     */
    function setVoteLockDuration(uint256 _duration) public ownerOnly greaterThanZero(_duration) {
        voteLockDuration = _duration;
        emit VoteLockDurationUpdated(_duration);
    }

    /**
     * @notice creates a new proposal
     *
     * @param _executor the address of the contract that will execute the proposal after it passes
     * @param _hash ipfs hash of the proposal description
     */
    function propose(address _executor, string memory _hash) public {
        require(votesOf(msg.sender) > voteMinimumForProposal, "ERR_NOT_VOTE_MINIMUM");

        // create new proposal
        Proposal memory proposal = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            totalVotesFor: 0,
            totalVotesAgainst: 0,
            start: block.number,
            end: voteDuration.add(block.number),
            executor: _executor,
            hash: _hash,
            totalAvailableVotes: totalVotes,
            quorum: 0,
            quorumRequired: quorum,
            open: true,
            executed: false
        });

        proposals[proposalCount] = proposal;

        // emit proposal event
        emit NewProposal(proposalCount, block.number, voteDuration, msg.sender, _executor);

        // lock proposer
        updateVoteLock(proposal.end);

        // increment proposal count so next proposal gets the next higher id
        proposalCount = proposalCount.add(1);
    }

    /**
     * @notice executes a proposal
     *
     * @param _id id of the proposal to execute
     */
    function execute(uint256 _id) public proposalExists(_id) proposalEnded(_id) {
        // check for executed status
        require(!proposals[_id].executed, "ERR_ALREADY_EXECUTED");

        // get voting info of proposal
        (uint256 forRatio, uint256 againstRatio, uint256 quorumRatio) = proposalStats(_id);
        // check proposal state
        require(proposals[_id].quorumRequired < quorumRatio, "ERR_NO_QUORUM");

        // if the proposal is still open
        if (proposals[_id].open) {
            // tally votes
            tallyVotes(_id);
        }

        // set executed
        proposals[_id].executed = true;

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
    function tallyVotes(uint256 _id)
        public
        proposalExists(_id)
        proposalOpen(_id)
        proposalEnded(_id)
    {
        // get voting info of proposal
        (uint256 forRatio, uint256 againstRatio, ) = proposalStats(_id);

        // do we have a quorum?
        bool quorumReached = proposals[_id].quorum >= proposals[_id].quorumRequired;
        // close proposal
        proposals[_id].open = false;

        // emit proposal finished event
        emit ProposalFinished(_id, forRatio, againstRatio, quorumReached);
    }

    /**
     * @notice stakes vote tokens
     *
     * @param _amount amount of vote tokens to stake
     */
    function stake(uint256 _amount) public greaterThanZero(_amount) {
        // increase vote power
        votes[msg.sender] = votesOf(msg.sender).add(_amount);
        // increase total votes
        totalVotes = totalVotes.add(_amount);
        // transfer tokens to this contract
        govToken.safeTransferFrom(msg.sender, address(this), _amount);

        // lock staker to avoid flashloans messing around with total votes
        voteLocks[msg.sender] = Math.max(
            voteLocks[msg.sender],
            voteLockDuration.div(10).add(block.number)
        );

        // emit staked event
        emit Staked(msg.sender, _amount);
    }

    /**
     * @notice unstakes vote tokens
     *
     * @param _amount amount of vote tokens to unstake
     */
    function unstake(uint256 _amount) public greaterThanZero(_amount) {
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
    function voteFor(uint256 _id)
        public
        onlyStaker
        proposalExists(_id)
        proposalOpen(_id)
        proposalNotEnded(_id)
    {
        Proposal storage proposal = proposals[_id];
        vote(proposal, true);
    }

    /**
     * @notice votes against a proposal
     *
     * @param _id id of the proposal to vote against
     */
    function voteAgainst(uint256 _id)
        public
        onlyStaker
        proposalExists(_id)
        proposalOpen(_id)
        proposalNotEnded(_id)
    {
        Proposal storage proposal = proposals[_id];
        vote(proposal, false);
    }
}
