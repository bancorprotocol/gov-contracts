import {mine, timeTravel} from "../timeTravel";
import {propose, stake} from "./utils";
import BigNumber from "bignumber.js"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18
  const period = 5
  const lock = 5

  let governance: any;
  let rewardToken: any;
  let voteToken: any;

  const owner = accounts[0]
  const executor = accounts[2]
  const rewardDistributor = accounts[5]

  before(async () => {
    rewardToken = await TestToken.new()
    voteToken = await TestToken.new()

    // get the executor some tokens
    await voteToken.mint(
      executor,
      (100 * decimals).toString()
    )

    await rewardToken.mint(
      rewardDistributor,
      (100 * decimals).toString()
    )
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      rewardToken.address,
      voteToken.address
    );

    await governance.setRewardDistribution(
      rewardDistributor,
      {from: owner}
    )
    await governance.setVotePeriod(
      period,
      {from: owner}
    )
    await governance.setVoteLock(
      lock,
      {from: owner}
    )
  })

  describe("#getReward()", async () => {
    it("should get reward", async () => {
      const reward = 10
      // approve reward tokens
      await rewardToken.approve(
        governance.address,
        (reward * decimals).toString(),
        {from: rewardDistributor}
      )
      // notify reward
      await governance.notifyRewardAmount(
        (reward * decimals).toString(),
        {from: rewardDistributor}
      )
      // stake
      await stake(
        governance,
        voteToken,
        executor,
        2
      )
      // propose
      const proposalId = await propose(
        governance,
        executor
      )
      // vote proposal
      await governance.voteFor(
        proposalId,
        {from: executor}
      )
      // time travel 2 days
      await timeTravel(web3, 2 * 24 * 60 * 60)
      // get reward
      const {logs} = await governance.getReward(
        {from: executor}
      )
      assert.exists(logs[0], 'no logs returned!')
      assert.strictEqual(
        logs[0].event,
        "RewardPaid"
      )
      // check that we really got rewarded
      const paidReward = new BigNumber(logs[0].args.reward).dividedBy(decimals).toNumber()
      assert.isAbove(paidReward, 0.00000000000000)
    })
  })
})
