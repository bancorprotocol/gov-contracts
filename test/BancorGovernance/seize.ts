// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let rewardToken: any;
  let voteToken: any;
  let tokenToSeize: any;

  const owner = accounts[0]
  const executor = accounts[2]

  before(async () => {
    rewardToken = await TestToken.new()
    voteToken = await TestToken.new()
    tokenToSeize = await TestToken.new()

    // get the executor some tokens
    await tokenToSeize.mint(
      executor,
      (100 * decimals).toString()
    )
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      rewardToken.address,
      voteToken.address
    );
  })

  describe("#seize()", async () => {
    it("should be able to seize", async () => {
      const amt = 5;
      const executorBalance = (await tokenToSeize.balanceOf(executor) / decimals)

      // whoops, i transferred some tokens to the contract
      await tokenToSeize.transfer(
        governance.address,
        (amt * decimals).toString(),
        {from: executor}
      )

      const executorBalance2 = (await tokenToSeize.balanceOf(executor) / decimals)
      assert.strictEqual(
        executorBalance2,
        executorBalance - amt
      )

      const governanceBalance = (await tokenToSeize.balanceOf(governance.address) / decimals)
      assert.strictEqual(
        governanceBalance,
        amt
      )

      // no worries, i will put them somewhere safe ;)
      await governance.seize(
        tokenToSeize.address,
        (amt * decimals).toString(),
        {from: owner}
      )

      const governanceBalance2 = (await tokenToSeize.balanceOf(governance.address) / decimals)
      assert.strictEqual(
        governanceBalance2,
        governanceBalance - amt
      )

      const ownerBalance = (await tokenToSeize.balanceOf(owner) / decimals)
      assert.strictEqual(
        ownerBalance,
        amt
      )
    })

    it("should fail to seize vote tokens", async () => {
      await truffleAssert.fails(
        // seize
        governance.seize(
          voteToken.address,
          0,
          {from: owner}
        ),
        truffleAssert.ErrorType.REVERT,
        "vote"
      )
    })

    it("should fail to seize reward tokens", async () => {
      await truffleAssert.fails(
        // seize
        governance.seize(
          rewardToken.address,
          0,
          {from: owner}
        ),
        truffleAssert.ErrorType.REVERT,
        "reward"
      )
    })
  })
})
