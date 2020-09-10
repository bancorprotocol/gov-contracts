import {mine} from "../timeTravel";
import {propose, stake} from "./utils";

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18
  const lock = 5

  let governance: any;
  let token: any;
  let vote: any;

  const owner = accounts[0]
  const executor = accounts[2]

  before(async () => {
    token = await TestToken.new()
    vote = await TestToken.new()

    // get the executor some tokens
    await token.mint(
      executor,
      (100 * decimals).toString()
    )
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

    // lower lock to 5 blocks so we have to mine only a few blocks ahead
    await governance.setLock(
      lock,
      {from: owner}
    )
  })

  describe("#exit()", async () => {
    xit("should be able to exit", async () => {
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
      // mine some blocks to get out of the lock
      await mine(
        web3,
        lock + 1
      )
      // exit
      await governance.exit(
        {from: executor}
      )
    })
  })
})
