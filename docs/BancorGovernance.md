## `BancorGovernance`





### `updateReward(address account)`





### `onlyVoter()`






### `constructor(address _rewardTokenAddress, address _voteTokenAddress)` (public)





### `seize(contract IERC20 _token, uint256 amount)` (external)





### `setBreaker(bool _breaker)` (external)





### `setQuorum(uint256 _quorum)` (public)





### `setMinimum(uint256 _minimum)` (public)





### `setPeriod(uint256 _period)` (public)





### `setLock(uint256 _lock)` (public)





### `initialize(uint256 _proposalCount)` (public)





### `propose(address executor, string hash)` (public)





### `execute(uint256 id)` (public)





### `getStats(uint256 id) → uint256 _for, uint256 _against, uint256 _quorum` (public)





### `tallyVotes(uint256 id)` (public)





### `votesOf(address voter) → uint256` (public)





### `revoke()` (public)





### `voteFor(uint256 id)` (public)





### `voteAgainst(uint256 id)` (public)





### `lastTimeRewardApplicable() → uint256` (public)





### `rewardPerToken() → uint256` (public)





### `earned(address account) → uint256` (public)





### `stake(uint256 amount)` (public)





### `withdraw(uint256 amount)` (public)





### `exit()` (external)





### `getReward()` (public)





### `notifyRewardAmount(uint256 reward)` (external)





### `totalSupply() → uint256` (public)





### `balanceOf(address account) → uint256` (public)






### `NewProposal(uint256 id, address creator, uint256 start, uint256 duration, address executor)`





### `Vote(uint256 id, address voter, bool vote, uint256 weight)`





### `ProposalFinished(uint256 id, uint256 _for, uint256 _against, bool quorumReached)`





### `RevokeVoter(address voter, uint256 votes, uint256 totalVotes)`





### `RewardAdded(uint256 reward)`





### `Staked(address user, uint256 amount)`





### `Withdrawn(address user, uint256 amount)`





### `RewardPaid(address user, uint256 reward)`





