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

      // notify
      const {logs} = await governance.notifyRewardAmount(
        (reward * decimals).toString(),
        {from: rewardDistributor}
      )

      assert.strictEqual(
        logs[0].event,
        "RewardAdded"
      )
    })
  })
})
