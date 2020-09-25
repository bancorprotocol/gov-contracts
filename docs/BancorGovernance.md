## `BancorGovernance`





### `onlyStaker()`

allows execution by staker only



### `proposalNotEnded(uint256 _id)`

allows execution only when the proposal with given id is open




### `proposalEnded(uint256 _id)`

allows execution only when the proposal with given id has ended




### `greaterThanZero(uint256 _value)`

verifies that a value is greater than zero





### `constructor(contract IERC20 _govToken)` (public)

used to initialize a new BancorGovernance contract




### `calculateQuorumRatio(uint256 _id) → uint256` (internal)

returns the quorum ratio of a proposal




### `exit()` (external)

removes the caller's entire stake



### `proposalStats(uint256 _id) → uint256, uint256, uint256` (public)

returns the voting stats of a proposal




### `votesOf(address _voter) → uint256` (public)

returns the voting power of a given address




### `votesAgainstOf(address _voter, uint256 _id) → uint256` (public)

returns the voting power of a given address against a given proposal




### `votesForOf(address _voter, uint256 _id) → uint256` (public)

returns the voting power of a given address for a given proposal




### `setQuorum(uint256 _quorum)` (public)

updates the quorum needed for proposals to pass




### `setVoteMinimum(uint256 _voteMinimum)` (public)

updates the required votes needed to propose




### `setVoteDuration(uint256 _voteDuration)` (public)

updates the proposals voting duration




### `setVoteLock(uint256 _voteLock)` (public)

updates the post vote lock duration




### `propose(address _executor, string _hash)` (public)

creates a new proposal




### `execute(uint256 _id)` (public)

executes a proposal




### `tallyVotes(uint256 _id)` (public)

tallies votes of proposal with given id




### `stake(uint256 _amount)` (public)

stakes vote tokens




### `unstake(uint256 _amount)` (public)

unstakes vote tokens




### `voteFor(uint256 _id)` (public)

votes for a proposal




### `voteAgainst(uint256 _id)` (public)

votes against a proposal





### `NewProposal(uint256 _id, address _creator, uint256 _start, uint256 _duration, address _executor)`

triggered when a new proposal is created




### `ProposalFinished(uint256 _id, uint256 _for, uint256 _against, bool _quorumReached)`

triggered when voting on a proposal has ended




### `ProposalExecuted(uint256 _id, address _executor)`

triggered when a proposal was successfully executed




### `Staked(address _user, uint256 _amount)`

triggered when a stake has been added to the contract




### `Unstaked(address _user, uint256 _amount)`

triggered when a stake has been removed from the contract




### `Vote(uint256 _id, address _voter, bool _vote, uint256 _weight)`

triggered when a user votes on a proposal




### `VotesRevoked(address _voter, uint256 _votes, uint256 _totalVotes)`

triggered when voter has revoked its votes




### `QuorumChanged(uint256 _quorum)`

triggered when the quorum is changed




### `VoteMinimumChanged(uint256 _voteMinimum)`

triggered when the vote minimum is changed




### `VoteDurationChanged(uint256 _voteDuration)`

triggered when the vote duration is changed




### `VoteLockChanged(uint256 _voteLock)`

triggered when the vote lock is changed




