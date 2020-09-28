import {timeTravel} from "../timeTravel"
import {propose, stake} from "./utils"
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance")
  const TestToken = artifacts.require("TestToken")
  const TestExecutor = artifacts.require("TestExecutor")

  const decimals = 1e18
  const duration = 5

  let governance: any
  let govToken: any
  let contractToExecute: any

  const owner = accounts[0]
  const proposer = accounts[2]
  const voter1 = accounts[3]
  const voter2 = accounts[4]
  const executor = accounts[5]
  const someone = accounts[6]

  before(async () => {
    govToken = await TestToken.new()
    contractToExecute = await TestExecutor.new()

    // get the proposer some tokens
    await govToken.mint(proposer, (100 * decimals).toString())

    // get the voters some tokens
    await govToken.mint(voter1, (100 * decimals).toString())
    await govToken.mint(voter2, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(govToken.address)
  })

  describe("#execute()", async () => {
    it("should be able to execute", async () => {
      // stake
      await stake(governance, govToken, proposer, 2)
      // lower duration so we dot have to mine 17k blocks
      await governance.setVoteDuration(duration, {from: owner})
      // propose
      const proposalId = await propose(
        governance,
        proposer,
        contractToExecute.address
      )
      // stake
      await stake(governance, govToken, voter1, 2)
      // vote
      await governance.voteFor(proposalId, {from: voter1})
      // mine blocks
      await timeTravel(web3, duration + 1)
      // execute
      const {logs, blockNumber} = await governance.execute(proposalId, {
        from: executor,
      })
      // check that proposal has completed
      assert.strictEqual(logs[0].event, "ProposalFinished")
      // check that executor has been executed
      const [executedEvent] = await contractToExecute.getPastEvents(
        "Executed",
        {fromBlock: blockNumber, toBlock: blockNumber}
      )
      // check for event
      assert.exists(executedEvent)
      // check for event type
      assert.strictEqual(executedEvent.event, "Executed")
      // check for right proposal id
      assert.strictEqual(executedEvent.returnValues._id, proposalId)
    })

    it("should be able to execute even when tally votes was called before", async () => {
      // stake
      await stake(governance, govToken, proposer, 2)
      // lower duration so we dot have to mine 17k blocks
      await governance.setVoteDuration(duration, {from: owner})
      // propose
      const proposalId = await propose(
        governance,
        proposer,
        contractToExecute.address
      )
      // stake
      await stake(governance, govToken, voter1, 2)
      // vote
      await governance.voteFor(proposalId, {from: voter1})
      // mine blocks
      await timeTravel(web3, duration + 1)
      {
        // tally votes
        const {logs} = await governance.tallyVotes(proposalId, {from: someone})
        // check that proposal has finished
        assert.strictEqual(logs[0].event, "ProposalFinished")
      }
      {
        // execute
        const {logs} = await governance.execute(proposalId, {from: executor})
        // check that proposal has been executed
        assert.strictEqual(logs[0].event, "ProposalExecuted")
      }
    })

    it("should fail to execute when proposal is not finished yet", async () => {
      // stake
      await stake(governance, govToken, proposer, 2)
      // propose
      const proposalId = await propose(
        governance,
        proposer,
        contractToExecute.address
      )
      // fail
      await truffleAssert.fails(
        // execute
        governance.execute(proposalId, {from: executor}),
        truffleAssert.ErrorType.REVERT,
        "ERR_NOT_ENDED"
      )
    })

    it("should fail to execute when no quorum is found", async () => {
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
      const proposalId = await propose(
        governance,
        proposer,
        contractToExecute.address
      )
      // vote
      await governance.voteAgainst(proposalId, {from: voter1})
      // vote
      await governance.voteFor(proposalId, {from: voter2})
      // mine blocks
      await timeTravel(web3, duration + 1)
      // fail
      await truffleAssert.fails(
        // execute
        governance.execute(proposalId, {from: executor}),
        truffleAssert.ErrorType.REVERT,
        "ERR_NO_QUORUM"
      )
    })

    it("should fail to execute unknown proposal", async () => {
      // fail
      await truffleAssert.fails(
        // execute
        governance.execute("0x1337", {from: executor}),
        truffleAssert.ErrorType.REVERT,
        "ERR_NO_PROPOSAL"
      )
    })

    it("should fail to execute proposal twice", async () => {
      // stake
      await stake(governance, govToken, proposer, 2)
      // lower duration so we dot have to mine 17k blocks
      await governance.setVoteDuration(duration, {from: owner})
      // propose
      const proposalId = await propose(
        governance,
        proposer,
        contractToExecute.address
      )
      // stake
      await stake(governance, govToken, voter1, 2)
      // vote
      await governance.voteFor(proposalId, {from: voter1})
      // mine blocks
      await timeTravel(web3, duration + 1)
      // exit
      const {blockNumber} = await governance.execute(proposalId, {
        from: executor,
      })
      // check that executor has been executed
      await contractToExecute.getPastEvents("Executed", {
        fromBlock: blockNumber,
        toBlock: blockNumber,
      })
      // fail
      await truffleAssert.fails(
        // execute
        governance.execute(proposalId, {from: executor}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ALREADY_EXECUTED"
      )
    })
  })
})
