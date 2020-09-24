// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let govToken: any;

  const owner = accounts[0]
  const someone = accounts[5]

  before(async () => {
    govToken = await TestToken.new()
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      govToken.address
    );
  })

  describe("#setVoteMinimum()", async () => {
    it("should set vote minimum from owner", async () => {
      const voteMinimumBefore = await governance.voteMinimum.call()
      assert.strictEqual(
        (decimals).toString(),
        voteMinimumBefore.toString()
      )

      const voteMinimum = 5
      await governance.setVoteMinimum(
        (voteMinimum * decimals).toString(),
        {from: owner}
      )

      const voteMinimumAfter = await governance.voteMinimum.call()
      assert.strictEqual(
        (voteMinimum * decimals).toString(),
        voteMinimumAfter.toString()
      )
    })

    it("should fail to set minimum lock to 0", async () => {
      await truffleAssert.fails(
        // set vote minimum
        governance.setVoteMinimum(
          (0).toString(),
          {from: owner}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_ZERO_VALUE"
      )
    })

    it("should fail to set vote minimum from someone", async () => {
      await truffleAssert.fails(
        // set vote minimum
        governance.setVoteMinimum(
          (0).toString(),
          {from: someone}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_ACCESS_DENIED"
      )
    })
  })
})
