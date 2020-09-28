import {propose, stake} from "./utils"
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance")
  const TestToken = artifacts.require("TestToken")
  const decimals = 1e18

  let governance: any
  let govToken: any

  const proposer = accounts[2]
  const voter = accounts[3]

  before(async () => {
    govToken = await TestToken.new()

    // get the proposer some tokens
    await govToken.mint(proposer, (100 * decimals).toString())
    // get the voter some tokens
    await govToken.mint(voter, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(govToken.address)
  })

  describe("#voteAgainst()", async () => {
    it("should vote against own proposal", async () => {
      // proposer stake
      await stake(governance, govToken, proposer, 2)
      // propose
      const proposalId = await propose(governance, proposer)
      // vote against
      await governance.voteAgainst(proposalId, {from: proposer})
    })

    it("should vote against others proposal", async () => {
      const amount = 2
      // proposer stake
      await stake(governance, govToken, proposer, amount)
      // propose
      const proposalId = await propose(governance, proposer)
      // voter stake
      await stake(governance, govToken, voter, amount)
      // vote against
      await governance.voteAgainst(proposalId, {from: voter})
    })

    it("should override voting for a proposal when voting against it", async () => {
      const amount = 2
      // stake
      await stake(governance, govToken, proposer, amount)
      // propose
      const proposalId = await propose(governance, proposer)
      // vote for
      await governance.voteFor(proposalId, {from: proposer})
      // evaluate
      const proposalVoteFor = await governance.proposals.call(proposalId)
      assert.strictEqual(
        proposalVoteFor.totalVotesFor.toString(),
        (amount * decimals).toString()
      )
      assert.strictEqual(
        proposalVoteFor.totalVotesAgainst.toString(),
        (0).toString()
      )
      // vote against
      await governance.voteAgainst(proposalId, {from: proposer})
      // evaluate
      const proposalVoteAgainst = await governance.proposals.call(proposalId)
      assert.strictEqual(
        proposalVoteAgainst.totalVotesFor.toString(),
        (0).toString()
      )
      assert.strictEqual(
        proposalVoteAgainst.totalVotesAgainst.toString(),
        (amount * decimals).toString()
      )
    })

    it("should fail to vote against an unknown proposal", async () => {
      // voter stake
      await stake(governance, govToken, voter, 2)
      await truffleAssert.fails(
        // vote against
        governance.voteAgainst("0x1337", {from: voter}),
        truffleAssert.ErrorType.REVERT,
        "ERR_INVALID_ID"
      )
    })
  })
})
