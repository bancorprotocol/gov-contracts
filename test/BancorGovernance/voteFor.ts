import {propose, stake} from "./utils"
// @ts-ignore
import * as truffleAssert from "truffle-assertions"
import {timeTravel} from "../timeTravel"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance")
  const TestToken = artifacts.require("TestToken")
  const decimals = 1e18

  let governance: any
  let govToken: any

  const owner = accounts[0]
  const proposer = accounts[2]
  const voter = accounts[3]
  const someone = accounts[9]

  before(async () => {
    govToken = await TestToken.new()

    // get the executor some tokens
    await govToken.mint(proposer, (100 * decimals).toString())
    // get voter some tokens
    await govToken.mint(voter, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(govToken.address)
  })

  describe("#voteFor()", async () => {
    it("should vote for own proposal", async () => {
      // stake
      await stake(governance, govToken, proposer, 2)
      // propose
      const proposalId = await propose(governance, proposer)
      // vote for
      await governance.voteFor(proposalId, {from: proposer})
    })

    it("should vote for others proposal", async () => {
      const amount = 2
      // proposer stake
      await stake(governance, govToken, proposer, amount)
      // propose
      const proposalId = await propose(governance, proposer)
      // voter stake
      await stake(governance, govToken, voter, amount)
      // vote for
      await governance.voteFor(proposalId, {from: voter})
    })

    it("should note vote for twice", async () => {
      const amount = 2
      // proposer stake
      await stake(governance, govToken, proposer, amount)
      // propose
      const proposalId = await propose(governance, proposer)
      // voter stake
      await stake(governance, govToken, voter, amount)
      // vote for once
      await governance.voteFor(proposalId, {from: voter})
      // should be two
      const votesAfterOnce = (
        await governance.proposals(proposalId)
      ).totalVotesFor.toString()
      assert.strictEqual(votesAfterOnce, (amount * decimals).toString())
      // vote for twice
      await governance.voteFor(proposalId, {from: voter})
      // should still be two
      const votesAfterTwice = (
        await governance.proposals(proposalId)
      ).totalVotesFor.toString()
      assert.strictEqual(votesAfterTwice, (amount * decimals).toString())
    })

    it("should override voting against a proposal when voting for it", async () => {
      const amount = 2
      // proposer stake
      await stake(governance, govToken, proposer, amount)
      // propose
      const proposalId = await propose(governance, proposer)
      // voter stake
      await stake(governance, govToken, voter, amount)
      // vote against
      await governance.voteAgainst(proposalId, {from: voter})
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
      // vote for
      await governance.voteFor(proposalId, {from: voter})
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
    })

    it("should fail to vote for an unknown proposal", async () => {
      // voter stake
      await stake(governance, govToken, voter, 1)
      await truffleAssert.fails(
        // vote for
        governance.voteFor("0x1337", {from: voter}),
        truffleAssert.ErrorType.REVERT,
        "ERR_INVALID_ID"
      )
    })

    it("should fail to vote for from someone", async () => {
      // stake
      await stake(governance, govToken, proposer, 2)
      // propose
      const proposalId = await propose(governance, proposer)
      await truffleAssert.fails(
        // vote for
        governance.voteFor(proposalId, {from: someone}),
        truffleAssert.ErrorType.REVERT,
        "ERR_NOT_STAKER"
      )
    })

    it("should fail to vote for an expired proposal", async () => {
      const amount = 2
      // proposer stake
      await stake(governance, govToken, proposer, amount)
      await governance.setVoteDuration(2, {from: owner})
      // propose
      const proposalId = await propose(governance, proposer)
      // voter stake
      await stake(governance, govToken, voter, 1)
      // mine two blocks
      await timeTravel(web3, 2)
      // fail
      await truffleAssert.fails(
        // vote for
        governance.voteFor(proposalId, {from: voter}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ENDED"
      )
    })

    it("should fail to vote for an ended proposal", async () => {
      const amount = 2
      const duration = 5
      // stake
      await stake(governance, govToken, proposer, amount)
      // stake
      await stake(governance, govToken, voter, amount)
      // lower duration so we dot have to mine 17k blocks
      await governance.setVoteDuration(duration, {from: owner})
      // propose
      const proposalId = await propose(governance, proposer)
      // vote
      await governance.voteFor(proposalId, {from: voter})
      // mine blocks
      await timeTravel(web3, duration + 1)
      // execute
      await governance.tallyVotes(proposalId, {from: someone})
      // fail
      await truffleAssert.fails(
        // vote for second
        governance.voteFor(proposalId, {from: voter}),
        truffleAssert.ErrorType.REVERT,
        "ERR_NOT_OPEN"
      )
    })
  })
})
