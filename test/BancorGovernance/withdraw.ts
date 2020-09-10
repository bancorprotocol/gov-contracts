import {stake} from "./utils";

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let token: any;
  let vote: any;

  const executor = accounts[2]

  before(async () => {
    token = await TestToken.new()
    vote = await TestToken.new()

    // get the executor some tokens
    await vote.mint(executor, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      token.address,
      vote.address
    );
  })

  describe("#withdraw()", async () => {
    it("should be able to withdraw", async () => {
      const amount = 2
      // stake
      await stake(
        governance,
        vote,
        executor,
        amount
      )
      // withdraw
      await governance.withdraw(
        (amount * decimals).toString(),
        {from: executor}
      )
    })

  })
})
