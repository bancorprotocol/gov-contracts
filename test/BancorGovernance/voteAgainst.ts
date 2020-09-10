import {propose, stake} from "./utils";

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");
  const decimals = 1e18

  let governance: any;
  let voteToken: any;
  let rewardToken: any;

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

  describe("#voteAgainst()", async () => {
    it("should vote against a proposal", async () => {
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
      // vote against
      await governance.voteAgainst(
        proposalId,
        {from: executor}
      )
    })
  })
})
