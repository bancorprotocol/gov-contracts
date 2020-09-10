import {stake} from "./utils";

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let rewardToken: any;
  let voteToken: any;

  const executor = accounts[2]

  before(async () => {
    rewardToken = await TestToken.new()
    voteToken = await TestToken.new()

    // get the executor some tokens
    await voteToken.mint(executor, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      rewardToken.address,
      voteToken.address
    );
  })

  describe("#stake()", async () => {
    it("should be able to stake 2", async () => {
      await stake(
        governance,
        voteToken,
        executor,
        2
      )
    })

    it("should not be able to stake 0", async () => {
      try {
        // stake
        await governance.stake((0).toString(), {from: executor})
        assert.fail('staking with 0 was possible')
      } catch {
      }
    })
  })
})
