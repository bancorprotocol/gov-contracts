import {propose, stake} from "./utils"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance")
  const TestToken = artifacts.require("TestToken")
  const decimals = 1e18

  let governance: any
  let govToken: any

  const proposer = accounts[2]
  const someone = accounts[9]

  before(async () => {
    govToken = await TestToken.new()

    // get the executor some tokens
    await govToken.mint(proposer, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(govToken.address)
  })

  describe("#votesAgainstOf()", async () => {
    it("should return the against votes after voting", async () => {
      const amount = 2
      // stake
      await stake(governance, govToken, proposer, amount)
      // propose
      const proposalId = await propose(governance, proposer)
      // vote against
      await governance.voteAgainst(proposalId, {from: proposer})
      // get against votes for proposal and voter
      const againstVotes = await governance.votesAgainstOf(
        proposer,
        proposalId,
        {from: someone}
      )

      assert.strictEqual(
        againstVotes.toString(),
        (amount * decimals).toString()
      )
    })
  })
})
