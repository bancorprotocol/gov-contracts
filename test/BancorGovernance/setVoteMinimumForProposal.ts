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

  describe("#setVoteMinimumForProposal()", async () => {
    it("should set vote minimum from owner", async () => {
      const voteMinimumBefore = await governance.voteMinimumForProposal.call()
      assert.strictEqual(decimals.toString(), voteMinimumBefore.toString())

      const voteMinimum = 5
      await governance.setVoteMinimumForProposal(
        (voteMinimum * decimals).toString(),
        {
          from: owner,
        }
      )

      const voteMinimumAfter = await governance.voteMinimumForProposal.call()
      assert.strictEqual(
        (voteMinimum * decimals).toString(),
        voteMinimumAfter.toString()
      )
    })

    it("should fail to set minimum to 0", async () => {
      await truffleAssert.fails(
        // set vote minimum
        governance.setVoteMinimumForProposal((0).toString(), {from: owner}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ZERO_VALUE"
      )
    })

    it("should fail to set minimum lock to more than total supply", async () => {
      await truffleAssert.fails(
        // set vote minimum
        governance.setVoteMinimumForProposal((100 * decimals).toString(), {
          from: owner,
        }),
        truffleAssert.ErrorType.REVERT,
        "ERR_EXCEEDS_TOTAL_SUPPLY"
      )
    })

    it("should fail to set vote minimum from someone", async () => {
      await truffleAssert.fails(
        // set vote minimum
        governance.setVoteMinimumForProposal((0).toString(), {from: someone}),
        truffleAssert.ErrorType.REVERT,
        "ERR_ACCESS_DENIED"
      )
    })
  })
})