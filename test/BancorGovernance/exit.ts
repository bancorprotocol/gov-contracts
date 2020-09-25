import {propose, stake} from "./utils"
import {mine} from "../timeTravel"
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance")
  const TestToken = artifacts.require("TestToken")

  const decimals = 1e18

  let governance: any
  let govToken: any

  const owner = accounts[0]
  const proposer = accounts[2]
  const voter = accounts[2]

  before(async () => {
    govToken = await TestToken.new()

    // get the proposer some tokens
    await govToken.mint(proposer, (100 * decimals).toString())
    // get voter some tokens
    await govToken.mint(proposer, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(govToken.address)
  })

  describe("#exit()", async () => {
    it("should not be able to exit when not voted", async () => {
      // stake
      await stake(governance, govToken, proposer, 2)
      // exit
      await truffleAssert.fails(
        // exit
        governance.exit({from: proposer}),
        truffleAssert.ErrorType.REVERT,
        "ERR_LOCKED"
      )
    })

    it("should be able to exit when not voted after some time", async () => {
      // lower the vote lock
      await governance.setVoteLockDuration(2, {from: owner})
      // stake
      await stake(governance, govToken, proposer, 2)
      // let some time pass
      await mine(web3, 2)
      // exit
      await governance.exit({from: proposer})
    })

    it("should be able to exit when the period has passed", async () => {
      const period = 5
      // reduce locks
      await governance.setVoteDuration(period, {from: owner})
      await governance.setVoteLockDuration(period, {from: owner})
      // stake
      await stake(governance, govToken, proposer, 2)
      // propose
      const proposalId = await propose(governance, proposer)
      await stake(governance, govToken, voter, 1)
      // vote
      await governance.voteFor(proposalId, {from: voter})
      await mine(web3, period)
      // exit
      await governance.exit({from: voter})
    })

    it("should fail to exit when the period has not passed", async () => {
      // stake
      await stake(governance, govToken, proposer, 2)
      // propose
      const proposalId = await propose(governance, proposer)
      // stake
      await stake(governance, govToken, voter, 2)
      // vote
      await governance.voteFor(proposalId, {from: voter})
      await truffleAssert.fails(
        // exit
        governance.exit({from: voter}),
        truffleAssert.ErrorType.REVERT,
        "ERR_LOCKED"
      )
    })
  })
})
