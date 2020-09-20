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

  describe("#setVoteDuration()", async () => {
    it("should set vote lock from owner", async () => {
      const voteDurationBefore = await governance.voteDuration.call()
      assert.strictEqual(
        (17280).toString(),
        voteDurationBefore.toString()
      )

      const voteDuration = 5
      await governance.setVoteDuration(
        (voteDuration * decimals).toString(),
        {from: owner}
      )

      const voteDurationAfter = await governance.voteDuration.call()
      assert.strictEqual(
        (voteDuration * decimals).toString(),
        voteDurationAfter.toString()
      )
    })

    it("should fail to set vote lock from someone", async () => {
      await truffleAssert.fails(
        // set vote duration
        governance.setVoteDuration(
          (0).toString(),
          {from: someone}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_ACCESS_DENIED"
      )
    })
  })
})
