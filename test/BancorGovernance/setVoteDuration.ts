// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance")
  const TestToken = artifacts.require("TestToken")

  const decimals = 1e18

  let governance: any
  let govToken: any

  const owner = accounts[0]
  const someone = accounts[5]

  before(async () => {
    govToken = await TestToken.new()
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(govToken.address)
  })

  describe("#setVoteDuration()", async () => {
    it("should set vote duration from owner", async () => {
      const voteDurationBefore = await governance.voteDuration.call()
      assert.strictEqual((259200).toString(), voteDurationBefore.toString())

      const voteDuration = 5
      await governance.setVoteDuration(voteDuration.toString(), {
        from: owner,
      })

      const voteDurationAfter = await governance.voteDuration.call()
      assert.strictEqual(voteDuration.toString(), voteDurationAfter.toString())
    })

    it("should fail to set vote duration to 0", async () => {
      await truffleAssert.fails(
        // set vote duration
        governance.setVoteDuration((0).toString(), {from: owner}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ZERO_VALUE"
      )
    })

    it("should fail to set vote duration from someone", async () => {
      await truffleAssert.fails(
        // set vote duration
        governance.setVoteDuration((0).toString(), {from: someone}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ACCESS_DENIED"
      )
    })
  })
})
