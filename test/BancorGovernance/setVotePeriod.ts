// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let voteToken: any;

  const owner = accounts[0]
  const someone = accounts[5]

  before(async () => {
    voteToken = await TestToken.new()
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      voteToken.address
    );
  })

  describe("#setVotePeriod()", async () => {
    it("should set vote lock from owner", async () => {
      const votePeriodBefore = await governance.votePeriod.call()
      assert.strictEqual(
        (17280).toString(),
        votePeriodBefore.toString()
      )

      const votePeriod = 5
      await governance.setVotePeriod(
        (votePeriod * decimals).toString(),
        {from: owner}
      )

      const votePeriodAfter = await governance.votePeriod.call()
      assert.strictEqual(
        (votePeriod * decimals).toString(),
        votePeriodAfter.toString()
      )
    })

    it("should fail to set vote lock from someone", async () => {
      await truffleAssert.fails(
        // set vote period
        governance.setVotePeriod(
          (0).toString(),
          {from: someone}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_ACCESS_DENIED"
      )
    })
  })
})
