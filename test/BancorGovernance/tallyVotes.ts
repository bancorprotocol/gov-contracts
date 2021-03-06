import {timeTravel} from "../timeTravel"
import {propose, stake} from "./utils"
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance")
  const TestToken = artifacts.require("TestToken")

  const decimals = 1e18
  const duration = 5

  let governance: any
  let govToken: any

  const owner = accounts[0]
  const proposer = accounts[2]
  const voter1 = accounts[3]
  const voter2 = accounts[4]
  const someone = accounts[5]

  before(async () => {
    govToken = await TestToken.new()

    // get the proposer some tokens
    await govToken.mint(proposer, (100 * decimals).toString())

    // get the voters some tokens
    await govToken.mint(voter1, (100 * decimals).toString())
    await govToken.mint(voter2, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(govToken.address)
  })

  describe("#tallyVotes()", async () => {
    it("should be able to tally votes", async () => {
      // proposer stake
      await stake(governance, govToken, proposer, 2)
      // voter stake
      await stake(governance, govToken, voter1, 2)
      // lower duration so we dot have to mine 17k blocks
      await governance.setVoteDuration(duration, {from: owner})
      // propose
      const proposalId = await propose(governance, proposer)
      // vote
      await governance.voteFor(proposalId, {from: voter1})
      // mine blocks
      await timeTravel(web3, duration + 1)
      // tally votes
      const {logs} = await governance.tallyVotes(proposalId, {from: someone})
      // check that proposal has completed
      assert.strictEqual(logs[0].event, "ProposalFinished")
      // and quorum reached
      assert.strictEqual(logs[0].args._quorumReached, true)
    })

    it("should fail to tally votes twice", async () => {
      // proposer stake
      await stake(governance, govToken, proposer, 2)
      // voter stake
      await stake(governance, govToken, voter1, 2)
      // lower duration so we dot have to mine 17k blocks
      await governance.setVoteDuration(duration, {from: owner})
      // propose
      const proposalId = await propose(governance, proposer)
      // vote
      await governance.voteFor(proposalId, {from: voter1})
      // mine blocks
      await timeTravel(web3, duration + 1)
      // tally votes
      await governance.tallyVotes(proposalId, {from: someone})
      // fail
      await truffleAssert.fails(
        // execute
        governance.tallyVotes(proposalId, {from: someone}),
        truffleAssert.ErrorType.REVERT,
        "ERR_NOT_OPEN"
      )
    })

    it("should return no quorum when no quorum was found", async () => {
      const amount = 2
      // proposer stake
      await stake(governance, govToken, proposer, 50)
      // voter1 stake
      await stake(governance, govToken, voter1, amount)
      // voter2 stake
      await stake(governance, govToken, voter2, amount)
      // lower duration so we dot have to mine 17k blocks
      await governance.setVoteDuration(duration, {from: owner})
      // propose
      const proposalId = await propose(governance, proposer)
      // vote
      await governance.voteAgainst(proposalId, {from: voter1})
      // vote
      await governance.voteFor(proposalId, {from: voter2})
      // mine blocks
      await timeTravel(web3, duration + 1)
      // tally votes
      const {logs} = await governance.tallyVotes(proposalId, {from: someone})
      // check that proposal has completed
      assert.strictEqual(logs[0].event, "ProposalFinished")
      // and quorum failed to reach
      assert.strictEqual(logs[0].args._quorumReached, false)
    })
  })
})
