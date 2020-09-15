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
  const executor = accounts[2]

  before(async () => {
    voteToken = await TestToken.new()

    // get the executor some tokens
    await voteToken.mint(
      executor,
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
        executor,
        2
      )
      // exit
      await governance.exit(
        {from: executor}
      )
    })

    it("should be able to exit when the period has passed", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        executor,
        2
      )
      // propose
      const proposalId = await propose(
        governance,
        executor
      )
      // reduce vote lock
      await governance.setVoteLock(
        2,
        {from: owner}
      )
      // vote
      await governance.voteFor(
        proposalId,
        {from: executor}
      )
      await mine(web3, 2)
      // exit
      await governance.exit(
        {from: executor}
      )
    })

    it("should fail to exit when the period has not passed", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        executor,
        2
      )
      // propose
      const proposalId = await propose(
        governance,
        executor
      )
      // vote
      await governance.voteFor(
        proposalId,
        {from: executor}
      )
      await truffleAssert.fails(
        // exit
        governance.exit(
          {from: executor}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_LOCKED"
      )
    })
  })
})
