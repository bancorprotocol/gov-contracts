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

  describe("#setVoteLock()", async () => {
    it("should set vote lock from owner", async () => {
      const voteLockBefore = await governance.voteLock.call()
      assert.strictEqual((17280).toString(), voteLockBefore.toString())

      const voteLock = 5
      await governance.setVoteLock((voteLock * decimals).toString(), {
        from: owner,
      })

      const voteLockAfter = await governance.voteLock.call()
      assert.strictEqual(
        (voteLock * decimals).toString(),
        voteLockAfter.toString()
      )
    })

    it("should fail to set vote lock to 0", async () => {
      await truffleAssert.fails(
        // set vote lock
        governance.setVoteLock((0).toString(), {from: owner}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ZERO_VALUE"
      )
    })

    it("should fail to set vote lock from someone", async () => {
      await truffleAssert.fails(
        // set vote lock
        governance.setVoteLock((0).toString(), {from: someone}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ACCESS_DENIED"
      )
    })
  })
})
