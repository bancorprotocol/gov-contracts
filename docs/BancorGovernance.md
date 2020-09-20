## `BancorGovernance`





### `onlyVoter()`

Only allow voters to call methods flagged with this modifier



### `onlyStaker()`

Only allow stakers to call methods flagged with this modifier



### `proposalOpen(uint256 id)`

Only allow to continue of proposal with given id is open



### `proposalEnded(uint256 id)`

Only allow to continue of proposal with given id has ended




### `constructor(address _govTokenAddress)` (public)





### `calculateQuorumRatio(uint256 id) → uint256` (internal)

Helper method to calculate the quorum ratio of a proposal




### `exit()` (external)

Exit this contract and remove all the stake



### `proposalStats(uint256 id) → uint256 _for, uint256 _against, uint256 _quorum` (public)

Helper method to get the voting stats of a proposal




### `votesOf(address voter) → uint256` (public)

Get the voting power of an address




### `setQuorum(uint256 _quorum)` (public)

Set quorum needed for proposals to pass




### `setVoteMinimum(uint256 _voteMinimum)` (public)

Set required votes needed to propose




### `setVoteDuration(uint256 _voteDuration)` (public)

Set duration of proposals run




### `setVoteLock(uint256 _voteLock)` (public)

Set duration tokens being locked after voting




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

A new proposal was created



### `ProposalFinished(uint256 id, uint256 _for, uint256 _against, bool quorumReached)`

A proposal has finished voting



### `ProposalExecuted(uint256 id, address executor)`

A proposal has been successfully executed



### `Vote(uint256 id, address voter, bool vote, uint256 weight)`

A vote has been placed on a proposal



### `VotesRevoked(address voter, uint256 votes, uint256 totalVotes)`

A voter has revoked its votes



### `Staked(address user, uint256 amount)`

A stake has been added to the contract



### `Unstaked(address user, uint256 amount)`

A stake has been removed from the contract



