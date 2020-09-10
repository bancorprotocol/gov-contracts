import {propose, stake} from "./utils";

contract("YearnGovernance", async (accounts) => {
  const YearnGovernance = artifacts.require("YearnGovernance");
  const TestToken = artifacts.require("TestToken");
  const decimals = 1e18

  let governance: any;
  let token: any;
  let vote: any;

  const executor = accounts[2]

  before(async () => {
    token = await TestToken.new()
    vote = await TestToken.new()

    // get the executor some tokens
    await token.mint(executor, (100 * decimals).toString())
    await vote.mint(executor, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await YearnGovernance.new(
      token.address,
      vote.address
    );
  })

  describe("#voteAgainst()", async () => {
    it("should vote against a proposal", async () => {
      // stake
      await stake(
        governance,
        vote,
        executor,
        2
      )
      // propose
      const proposalId = await propose(
        governance,
        vote,
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
