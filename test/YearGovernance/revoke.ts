import {propose, stake} from "./utils";

contract("YearnGovernance", async (accounts) => {
  const YearnGovernance = artifacts.require("YearnGovernance");
  const TestToken = artifacts.require("TestToken");
  const decimals = 1e18

  let governance: any;
  let token: any;
  let vote: any;

  const executor = accounts[2]
  const someone = accounts[3]

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

  describe("#revoke()", async () => {
    it("should be able to revoke votes", async () => {
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
      // vote for
      await governance.voteFor(
        proposalId,
        {from: executor}
      )
      // revoke
      await governance.revoke(
        {from: executor}
      )
    })

    it("should not be able to revoke if not voted", async () => {
      try {
        await governance.revoke(
          {from: someone}
        )
        assert.fail('able to revoke if not staked!')
      } catch {
      }
    })
  })
})
