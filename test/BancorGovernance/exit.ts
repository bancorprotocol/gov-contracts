import {propose, stake} from "./utils";
import {mine} from "../timeTravel";
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let voteToken: any;

  const owner = accounts[0]
  const proposer = accounts[2]
  const voter = accounts[2]

  before(async () => {
    voteToken = await TestToken.new()

    // get the proposer some tokens
    await voteToken.mint(
      proposer,
      (100 * decimals).toString()
    )
    // get voter some tokens
    await voteToken.mint(
      proposer,
      (100 * decimals).toString()
    )
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      voteToken.address
    );
  })

  describe("#exit()", async () => {
    it("should be able to exit when not voted", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        proposer,
        2
      )
      // exit
      await governance.exit(
        {from: proposer}
      )
    })

    it("should be able to exit when the period has passed", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        proposer,
        2
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer
      )
      // reduce vote lock
      await governance.setVoteLock(
        2,
        {from: owner}
      )
      await stake(
        governance,
        voteToken,
        voter,
        1
      )
      // vote
      await governance.voteFor(
        proposalId,
        {from: voter}
      )
      await mine(web3, 2)
      // exit
      await governance.exit(
        {from: voter}
      )
    })

    it("should fail to exit when the period has not passed", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        proposer,
        2
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer
      )
      // stake
      await stake(
        governance,
        voteToken,
        voter,
        2
      )
      // vote
      await governance.voteFor(
        proposalId,
        {from: voter}
      )
      await truffleAssert.fails(
        // exit
        governance.exit(
          {from: voter}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_LOCKED"
      )
    })
  })
})
