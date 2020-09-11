import {timeTravel} from "../timeTravel";

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
    it("should notify the reward amount initially", async () => {
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
      assert.approximately(rewardRateAfter, 16534391534391, 1000000000)

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

    it("should add to the reward amount if the epoch has not passed yet", async () => {
      const reward = 10

      // grant governance access to the reward token owner by the distributor
      await rewardToken.approve(
        governance.address,
        // approve twice the reward so we have some left overs
        (reward * 2 * decimals).toString(),
        {from: rewardDistributor}
      )

      // notify initially
      await governance.notifyRewardAmount(
        (reward * decimals).toString(),
        {from: rewardDistributor}
      )

      const rewardRateAfter1: number = (await governance.rewardRate.call()).toNumber()
      // based on 7 days period duration
      assert.approximately(rewardRateAfter1, 16534391534391, 1000000000)

      const balance1: string = (await rewardToken.balanceOf(governance.address)).toString()
      assert.strictEqual(balance1, (reward * decimals).toString())

      // travel 3 days ahead
      await timeTravel(web3, 3 * 24 * 60 * 60)

      // do premature reward notification
      await governance.notifyRewardAmount(
        (reward * decimals).toString(),
        {from: rewardDistributor}
      )

      const rewardRateAfter2: number = (await governance.rewardRate.call()).toNumber()
      assert.approximately(rewardRateAfter2, 25982615268329, 1000000000)

      const balance2: string = (await rewardToken.balanceOf(governance.address)).toString()
      assert.strictEqual(balance2, (reward * 2 * decimals).toString())
    })

  })
})
