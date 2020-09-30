// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance")
  const TestToken = artifacts.require("TestToken")

  const decimals = 1e18

  let governance: any
  let govToken: any

  const owner = accounts[0]
  const bagHolder = accounts[1]
  const someone = accounts[5]

  before(async () => {
    govToken = await TestToken.new()

    await govToken.mint(bagHolder, (10 * decimals).toString(), {from: owner})
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(govToken.address)
  })

  describe("#setNewProposalMinimum()", async () => {
    it("should set new proposal minimum from owner", async () => {
      const minimumBefore = await governance.newProposalMinimum.call()
      assert.strictEqual(decimals.toString(), minimumBefore.toString())

      const minimum = 5
      await governance.setNewProposalMinimum((minimum * decimals).toString(), {
        from: owner,
      })

      const minimumAfter = await governance.newProposalMinimum.call()
      assert.strictEqual(
        (minimum * decimals).toString(),
        minimumAfter.toString()
      )
    })

    it("should fail to set minimum to 0", async () => {
      await truffleAssert.fails(
        // set new proposal minimum
        governance.setNewProposalMinimum((0).toString(), {from: owner}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ZERO_VALUE"
      )
    })

    it("should fail to set minimum lock to more than total supply", async () => {
      await truffleAssert.fails(
        // set new proposal minimum
        governance.setNewProposalMinimum((100 * decimals).toString(), {
          from: owner,
        }),
        truffleAssert.ErrorType.REVERT,
        "ERR_EXCEEDS_TOTAL_SUPPLY"
      )
    })

    it("should fail to set new proposal minimum from someone", async () => {
      await truffleAssert.fails(
        // set new proposal minimum
        governance.setNewProposalMinimum((0).toString(), {from: someone}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ACCESS_DENIED"
      )
    })
  })
})
