## `BancorGovernance`





### `onlyVoter()`



Only allow voters to call methods flagged with this modifier

### `onlyStaker()`



Only allow stakers to call methods flagged with this modifier


### `constructor(address _voteTokenAddress)` (public)





### `getStats(uint256 id) → uint256 _for, uint256 _against, uint256 _quorum` (public)



Get the stats of a proposal


### `votesOf(address voter) → uint256` (public)



Get the voting power of an address


### `exit()` (external)



Exit this contract and remove all the stake

### `setQuorum(uint256 _quorum)` (public)



Set quorum needed for proposals to pass


### `setVoteMinimum(uint256 _voteMinimum)` (public)



Set required votes needed to propose


### `setVotePeriod(uint256 _votePeriod)` (public)



Set period of proposals run


### `setVoteLock(uint256 _voteLock)` (public)



Set period tokens being locked after voting


### `propose(address executor, string hash)` (public)



Create a new proposal


### `execute(uint256 id)` (public)



Execute a proposal


### `tallyVotes(uint256 id)` (public)



Tally votes of proposal with given id


### `revoke()` (public)



Revoke votes

### `voteFor(uint256 id)` (public)



Vote for a proposal


### `voteAgainst(uint256 id)` (public)



Vote against a proposal


### `stake(uint256 amount)` (public)



Stake with vote tokens


### `unstake(uint256 amount)` (public)



Unstake staked vote tokens



### `NewProposal(uint256 id, address creator, uint256 start, uint256 duration, address executor)`





### `ProposalFinished(uint256 id, uint256 _for, uint256 _against, bool quorumReached)`





### `ProposalExecuted(uint256 id, address executor)`





### `Vote(uint256 id, address voter, bool vote, uint256 weight)`





### `RevokeVoter(address voter, uint256 votes, uint256 totalVotes)`





### `Staked(address user, uint256 amount)`





### `Unstaked(address user, uint256 amount)`





