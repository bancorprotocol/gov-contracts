import {mine} from "../timeTravel";
import {propose, stake} from "./utils";

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let token: any;
  let vote: any;

  const owner = accounts[0]
  const executor = accounts[2]

  before(async () => {
    token = await TestToken.new()
    vote = await TestToken.new()

    // get the executor some tokens
    await vote.mint(
      executor,
      (100 * decimals).toString()
    )
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      token.address,
      vote.address
    );
  })

  describe("#exit()", async () => {
    it("should be able to exit", async () => {
      // stake
      await stake(
        governance,
        vote,
        executor,
        2
      )
      // propose
      const proposalId = await propose(
        governance,
        vote,
        executor
      )
      // vote
      await governance.voteFor(
        proposalId,
        {from: executor}
      )
      // this only works if breaker is set to true!
      // TODO: WHY?
      await governance.setBreaker(
        true,
        {from: owner}
      )
      // exit
      await governance.exit(
        {from: executor}
      )
    })
  })
})
