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

  describe("#setQuorum()", async () => {
    it("should set quorum from owner", async () => {
      const quorumBefore = await governance.quorum.call()
      assert.strictEqual(
        (2000).toString(),
        quorumBefore.toString()
      )

      const quorum = 5
      await governance.setQuorum(
        (quorum * decimals).toString(),
        {from: owner}
      )

      const quorumAfter = await governance.quorum.call()
      assert.strictEqual(
        (quorum * decimals).toString(),
        quorumAfter.toString()
      )
    })

    it("should fail to set quorum from someone", async () => {
      await truffleAssert.fails(
        // set quorum
        governance.setQuorum(
          (0).toString(),
          {from: someone}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_ACCESS_DENIED"
      )
    })
  })
})
