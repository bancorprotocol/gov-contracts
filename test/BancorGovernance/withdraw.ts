import {stake} from "./utils";
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let rewardToken: any;
  let voteToken: any;

  const executor = accounts[2]

  before(async () => {
    rewardToken = await TestToken.new()
    voteToken = await TestToken.new()

    // get the executor some tokens
    await voteToken.mint(executor, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      rewardToken.address,
      voteToken.address
    );
  })

  describe("#withdraw()", async () => {
    it("should be able to withdraw", async () => {
      const amount = 2
      // stake
      await stake(
        governance,
        voteToken,
        executor,
        amount
      )
      // withdraw
      await governance.withdraw(
        (amount * decimals).toString(),
        {from: executor}
      )
    })

    it("should not be able to stake 0", async () => {
      await truffleAssert.fails(
        // stake
        governance.withdraw(
          (0).toString(),
          {from: executor}
        ),
        truffleAssert.ErrorType.REVERT,
        "Cannot withdraw 0"
      )
    })
  })
})
