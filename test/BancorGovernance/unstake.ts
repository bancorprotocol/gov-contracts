import {propose, stake} from "./utils";
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let govToken: any;

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
    governance = await BancorGovernance.new(
      govToken.address
    );
  })

  describe("#unstake()", async () => {
    it("should be able to unstake", async () => {
      const amount = 2

      const votesBefore = (await governance.votesOf(voter)).toString()
      assert.strictEqual(
        votesBefore,
        (0).toString()
      )

      // stake
      await stake(
        governance,
        govToken,
        voter,
        amount
      )
      // unstake
      await governance.unstake(
        (amount * decimals).toString(),
        {from: voter}
      )
    })

    it("should be unable to unstake when vote lock is on", async () => {
      const amount = 2
      // stake
      await stake(
        governance,
        govToken,
        proposer,
        amount
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer
      )
      // stake
      await stake(
        governance,
        govToken,
        voter,
        amount
      )
      // vote for
      await governance.voteFor(
        proposalId,
        {from: voter}
      )
      await truffleAssert.fails(
        // unstake
        governance.unstake(
          (amount * decimals).toString(),
          {from: voter}
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
          {from: voter}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_ZERO_VALUE"
      )
    })
  })
})
