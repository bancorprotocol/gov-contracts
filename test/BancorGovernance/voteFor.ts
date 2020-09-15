import {propose, stake} from "./utils";
// @ts-ignore
import * as truffleAssert from "truffle-assertions"
import {mine, timeTravel} from "../timeTravel";

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");
  const decimals = 1e18

  let governance: any;
  let voteToken: any;

  const owner = accounts[0]
  const proposer = accounts[2]
  const voter = accounts[3]

  before(async () => {
    voteToken = await TestToken.new()

    // get the executor some tokens
    await voteToken.mint(proposer, (100 * decimals).toString())
    // get voter some tokens
    await voteToken.mint(voter, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      voteToken.address
    );
  })

  describe("#voteFor()", async () => {
    it("should vote for own proposal", async () => {
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
      // vote for
      await governance.voteFor(
        proposalId,
        {from: proposer}
      )
    })

    it("should vote for others proposal", async () => {
      const amount = 2
      // proposer stake
      await stake(
        governance,
        voteToken,
        proposer,
        amount
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer
      )
      // voter stake
      await stake(
        governance,
        voteToken,
        voter,
        amount
      )
      // vote for
      await governance.voteFor(
        proposalId,
        {from: voter}
      )
    })

    it("should note vote for twice", async () => {
      const amount = 2
      // proposer stake
      await stake(
        governance,
        voteToken,
        proposer,
        amount
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer
      )
      // voter stake
      await stake(
        governance,
        voteToken,
        voter,
        amount
      )
      // vote for once
      await governance.voteFor(
        proposalId,
        {from: voter}
      )
      // should be two
      const votesAfterOnce = (await governance.proposals(proposalId)).totalForVotes.toString()
      assert.strictEqual(
        votesAfterOnce,
        (amount * decimals).toString()
      )
      // vote for twice
      await governance.voteFor(
        proposalId,
        {from: voter}
      )
      // should still be two
      const votesAfterTwice = (await governance.proposals(proposalId)).totalForVotes.toString()
      assert.strictEqual(
        votesAfterTwice,
        (amount * decimals).toString()
      )
    })

    it("should override voting against a proposal when voting for it", async () => {
      const amount = 2
      // proposer stake
      await stake(
        governance,
        voteToken,
        proposer,
        amount
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer
      )
      // voter stake
      await stake(
        governance,
        voteToken,
        voter,
        amount
      )
      // vote against
      await governance.voteAgainst(
        proposalId,
        {from: voter}
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
        {from: voter}
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
      // voter stake
      await stake(
        governance,
        voteToken,
        voter,
        1
      )
      await truffleAssert.fails(
        // vote for
        governance.voteFor(
          "0x1337",
          {from: voter}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_NO_PROPOSAL"
      )
    })

    it("should fail to vote for an expired proposal", async () => {
      const amount = 2
      // proposer stake
      await stake(
        governance,
        voteToken,
        proposer,
        amount
      )
      await governance.setVotePeriod(
        2,
        {from: owner}
      )
      // propose
      const proposalId = await propose(
        governance,
        proposer
      )
      // voter stake
      await stake(
        governance,
        voteToken,
        voter,
        1
      )
      // mine two blocks
      await mine(web3, 2)
      // fail
      await truffleAssert.fails(
        // vote for
        governance.voteFor(
          proposalId,
          {from: voter}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_ENDED"
      )
    })
  })
})
