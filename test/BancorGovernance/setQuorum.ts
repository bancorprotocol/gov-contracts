// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance")
  const TestToken = artifacts.require("TestToken")

  const digits = 10000

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

  describe("#setQuorum()", async () => {
    it("should set quorum from owner", async () => {
      const quorumBefore = await governance.quorum.call()
      assert.strictEqual((200000).toString(), quorumBefore.toString())

      const quorum = 5
      await governance.setQuorum((quorum * digits).toString(), {from: owner})

      const quorumAfter = await governance.quorum.call()
      assert.strictEqual((quorum * digits).toString(), quorumAfter.toString())
    })

    it("should set quorum to 100", async () => {
      await governance.setQuorum((100 * digits).toString(), {from: owner})
      const quorumAfter = await governance.quorum.call()
      assert.strictEqual((100 * digits).toString(), quorumAfter.toString())
    })

    it("should fail to set quorum to 0", async () => {
      await truffleAssert.fails(
        // set quorum
        governance.setQuorum((0).toString(), {from: owner}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ZERO_VALUE"
      )
    })

    it("should fail to set quorum to 110", async () => {
      await truffleAssert.fails(
        // set quorum
        governance.setQuorum((110 * digits).toString(), {from: owner}),
        truffleAssert.ErrorType.REVERT,
        "ERR_QUORUM_TOO_HIGH"
      )
    })

    it("should fail to set quorum from someone", async () => {
      await truffleAssert.fails(
        // set quorum
        governance.setQuorum((0).toString(), {from: someone}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ACCESS_DENIED"
      )
    })
  })
})
