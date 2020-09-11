import {stake} from "./utils";

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let rewardToken: any;
  let voteToken: any;

  const owner = accounts[0]
  const rewardDistributor = accounts[5]

  before(async () => {
    rewardToken = await TestToken.new()
    voteToken = await TestToken.new()

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
  })

  describe("#notifyRewardAmount()", async () => {
    it("should notify the reward amount", async () => {
      const reward = 10

      // grant governance access to the reward token owner by the distributor
      await rewardToken.approve(
        governance.address,
        (reward * decimals).toString(),
        {from: rewardDistributor}
      )

      const rewardRateBefore = (await governance.rewardRate.call()).toNumber()
      assert.strictEqual(rewardRateBefore, 0)

      // notify
      const {logs} = await governance.notifyRewardAmount(
        (reward * decimals).toString(),
        {from: rewardDistributor}
      )

      const rewardRateAfter = (await governance.rewardRate.call()).toNumber()
      // based on 7 days period duration
      assert.strictEqual(rewardRateAfter, 16534391534391)

      // check that reward was really added
      assert.strictEqual(
        logs[0].event,
        "RewardAdded"
      )

      // check for right reward height
      assert.strictEqual(
        logs[0].args.reward.toString(),
        (reward * decimals).toString()
      )

      // check that governance contract really has the right balance of reward tokens
      const balance = await rewardToken.balanceOf(governance.address)

      assert.strictEqual(
        balance.toString(),
        (reward * decimals).toString()
      )
    })
  })
})
