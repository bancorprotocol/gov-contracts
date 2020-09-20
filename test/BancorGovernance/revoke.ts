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
  const someone = accounts[4]

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

  describe("#revoke()", async () => {
    it("should be able to revoke votes", async () => {
      // stake
      await stake(
        governance,
        govToken,
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
        govToken,
        voter,
        2
      )
      // vote for
      await governance.voteFor(
        proposalId,
        {from: voter}
      )
      // revoke
      await governance.revokeVotes(
        {from: voter}
      )
    })

    it("should not be able to revoke twice", async () => {
      // stake
      await stake(
        governance,
        govToken,
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
      // revoke
      await governance.revokeVotes(
        {from: proposer}
      )
      // should not revoke twice
      await truffleAssert.fails(
        // revoke
        governance.revokeVotes(
          {from: proposer}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_NOT_VOTER"
      );
    })

    it("should not be able to revoke if not voted", async () => {
      await truffleAssert.fails(
        // revoke
        governance.revokeVotes(
          {from: someone}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_NOT_VOTER"
      );
    })
  })
})
