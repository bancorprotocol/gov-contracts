import {propose, stake} from "./utils";
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let voteToken: any;

  const executor = accounts[2]

  before(async () => {
    voteToken = await TestToken.new()

    // get the executor some tokens
    await voteToken.mint(executor, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      voteToken.address
    );
  })

  describe("#unstake()", async () => {
    it("should be able to unstake", async () => {
      const amount = 2
      // stake
      await stake(
        governance,
        voteToken,
        executor,
        amount
      )
      // unstake
      await governance.unstake(
        (amount * decimals).toString(),
        {from: executor}
      )
    })

    it("should be unable to unstake when vote lock is on", async () => {
      const amount = 2
      // stake
      await stake(
        governance,
        voteToken,
        executor,
        amount
      )
      // propose
      const proposalId = await propose(
        governance,
        executor
      )
      // vote for
      await governance.voteFor(
        proposalId,
        {from: executor}
      )
      await truffleAssert.fails(
        // unstake
        governance.unstake(
          (amount * decimals).toString(),
          {from: executor}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_LOCKED"
      )
    })

    it("should not be able to stake 0", async () => {
      await truffleAssert.fails(
        // unstake
        governance.unstake(
          (0).toString(),
          {from: executor}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_UNSTAKE_ZERO"
      )
    })
  })
})
