## `BancorGovernance`





### `onlyStaker()`

allows execution by staker only



### `proposalExists(uint256 _id)`

allows execution only when the proposal exists




### `proposalOpen(uint256 _id)`

allows execution only when the proposal is still open




### `proposalNotEnded(uint256 _id)`

allows execution only when the proposal with given id is open




### `proposalEnded(uint256 _id)`

allows execution only when the proposal with given id has ended




### `greaterThanZero(uint256 _value)`

verifies that a value is greater than zero





### `constructor(contract IERC20 _govToken)` (public)

used to initialize a new BancorGovernance contract




### `calculateQuorumRatio(struct BancorGovernance.Proposal _proposal) → uint256` (internal)

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




### `setNewProposalMinimum(uint256 _minimum)` (public)

updates the minimum stake required to create a new proposal




### `setVoteDuration(uint256 _voteDuration)` (public)

updates the proposals voting duration




### `setVoteLockDuration(uint256 _duration)` (public)

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





### `NewProposal(uint256 _id, uint256 _start, uint256 _duration, address _proposer, address _executor)`

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




### `QuorumUpdated(uint256 _quorum)`

triggered when the quorum is updated




### `NewProposalMinimumUpdated(uint256 _minimum)`

triggered when the minimum stake required to create a new proposal is updated




### `VoteDurationUpdated(uint256 _voteDuration)`

triggered when the vote duration is updated




### `VoteLockDurationUpdated(uint256 _duration)`

triggered when the vote lock duration is updated




