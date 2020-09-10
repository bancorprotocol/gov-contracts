import {propose, stake} from "./utils";

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");
  const decimals = 1e18

  let governance: any;
  let token: any;
  let vote: any;

  const executor = accounts[2]

  before(async () => {
    vote = await TestToken.new()
    token = await TestToken.new()

    // get the executor some tokens
    await vote.mint(executor, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
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
