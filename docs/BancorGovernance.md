## `BancorGovernance`





### `updateReward(address account)`





### `onlyVoter()`






### `constructor(address _rewardTokenAddress, address _voteTokenAddress)` (public)





### `getStats(uint256 id) → uint256 _for, uint256 _against, uint256 _quorum` (public)



Get the stats of a proposal


### `votesOf(address voter) → uint256` (public)





### `lastTimeRewardApplicable() → uint256` (public)





### `rewardPerToken() → uint256` (public)





### `earned(address account) → uint256` (public)





### `totalSupply() → uint256` (public)





### `balanceOf(address account) → uint256` (public)





### `seize(contract IERC20 _token, uint256 amount)` (external)



Fee collection for any other token


### `notifyRewardAmount(uint256 reward)` (external)





### `exit()` (external)





### `setBreaker(bool _breaker)` (public)



Turn breaker on or off


### `setQuorum(uint256 _quorum)` (public)



Set quorum needed for proposals to pass


### `setMinimum(uint256 _minimum)` (public)





### `setPeriod(uint256 _period)` (public)





### `setLock(uint256 _lock)` (public)





### `propose(address executor, string hash)` (public)



Create a new proposal


### `execute(uint256 id)` (public)



Execute a proposal


### `tallyVotes(uint256 id)` (public)





### `revoke()` (public)



Revoke votes

### `voteFor(uint256 id)` (public)



Vote for a proposal


### `voteAgainst(uint256 id)` (public)



Vote against a proposal


### `stake(uint256 amount)` (public)



Stake with vote tokens


### `withdraw(uint256 amount)` (public)



Withdraw staked vote tokens


### `getReward()` (public)






### `NewProposal(uint256 id, address creator, uint256 start, uint256 duration, address executor)`





### `Vote(uint256 id, address voter, bool vote, uint256 weight)`





### `ProposalFinished(uint256 id, uint256 _for, uint256 _against, bool quorumReached)`





### `RevokeVoter(address voter, uint256 votes, uint256 totalVotes)`





### `RewardAdded(uint256 reward)`





### `Staked(address user, uint256 amount)`





### `Withdrawn(address user, uint256 amount)`





### `RewardPaid(address user, uint256 reward)`





