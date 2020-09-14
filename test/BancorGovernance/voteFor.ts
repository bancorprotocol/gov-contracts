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

  describe("#voteFor()", async () => {
    it("should vote for a proposal", async () => {
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
      // vote for
      await governance.voteFor(
        proposalId,
        {from: executor}
      )
    })

    it("should override voting against a proposal when voting for it", async () => {
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
      // vote against
      await governance.voteAgainst(
        proposalId,
        {from: executor}
      )
      // evaluate
      const proposalVoteAgainst = await governance.proposals.call(proposalId)
      assert.strictEqual(
        proposalVoteAgainst.totalForVotes.toString(),
        (0).toString()
      )
      assert.strictEqual(
        proposalVoteAgainst.totalAgainstVotes.toString(),
        (amount * decimals).toString()
      )
      // vote for
      await governance.voteFor(
        proposalId,
        {from: executor}
      )
      // evaluate
      const proposalVoteFor = await governance.proposals.call(proposalId)
      assert.strictEqual(
        proposalVoteFor.totalForVotes.toString(),
        (amount * decimals).toString()
      )
      assert.strictEqual(
        proposalVoteFor.totalAgainstVotes.toString(),
        (0).toString()
      )
    })

    it("should fail to vote for an unknown proposal", async () => {
      await truffleAssert.fails(
        // vote against
        governance.voteFor(
          "0x1337",
          {from: executor}
        ),
        truffleAssert.ErrorType.REVERT,
        "no such proposal"
      )
    })
  })
})
