import {mine} from "../timeTravel";
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
    await governance.setPeriod(
      period,
      {from: owner}
    )
    await governance.setLock(
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
      // let some time pass!
      await mine(web3, 2)
      // vote proposal
      await governance.voteFor(
        proposalId,
        {from: executor}
      )
      // let some time pass!
      await mine(web3, 2)
      // exit
      const {logs} = await governance.getReward(
        {from: executor}
      )
      assert.exists(logs[0], 'no logs returned!')
      assert.strictEqual(
        logs[0].event,
        "RewardPaid"
      )

      const paidReward = new BigNumber(logs[0].args.reward).dividedBy(decimals).toNumber()
      assert.isAbove(paidReward, 0.00000000000000)
    })
  })
})
