import {confirmTransaction, deployMultiSig, submitTransaction} from "./utils";

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  let MultiSigWalletWithDailyLimit: any
  let governance: any;
  let rewardToken: any;
  let voteToken: any;

  const owner = accounts[0]
  const deployer = accounts[1]

  // 3 owners
  const owners = [
    accounts[2],
    accounts[3],
    accounts[4],
  ]
  // at least 2 confirmations
  const requiredSignatures = 2
  // 5 ether limit
  const limit = 5
  const limitInWei: string = web3.utils.toWei(limit.toString(), "ether")

  before(async () => {
    rewardToken = await TestToken.new()
    voteToken = await TestToken.new()
  })

  beforeEach(async () => {
    MultiSigWalletWithDailyLimit = await deployMultiSig(
      web3,
      owners,
      requiredSignatures.toString(),
      limitInWei,
      deployer
    )

    governance = await BancorGovernance.new(
      rewardToken.address,
      voteToken.address
    );
  })

  describe('MultiSigWalletWithDailyLimit', async () => {
    it("should deploy and configure properly", async () => {
      const r = await MultiSigWalletWithDailyLimit.methods.required().call()
      assert.strictEqual(
        r.toString(),
        requiredSignatures.toString()
      )

      const l = await MultiSigWalletWithDailyLimit.methods.dailyLimit().call()
      assert.strictEqual(l.toString(), limitInWei)

      const o = await MultiSigWalletWithDailyLimit.methods.owners(0).call()
      assert.strictEqual(o, owners[0])
    })

    describe('transferOwnership', async () => {
      it("should transfer ownership to multi sig instance", async () => {
        // transferOwnership to multi sig
        await governance.transferOwnership(
          MultiSigWalletWithDailyLimit.options.address,
          {from: owner}
        )

        // check that new owner is set to multi sig
        const newOwner = await governance.newOwner.call()
        assert.strictEqual(
          newOwner,
          MultiSigWalletWithDailyLimit.options.address
        )

        // but current owner should stay untouched
        const currentOwner = await governance.owner.call()
        assert.strictEqual(
          currentOwner,
          owner
        )
      })

      it("should accept ownership from multi sig", async () => {
        // transfer ownership to multi sig
        await governance.transferOwnership(
          MultiSigWalletWithDailyLimit.options.address,
          {from: owner}
        )

        // check that new owner is really set to the right address
        const newOwnerBefore = await governance.newOwner.call()
        assert.strictEqual(
          newOwnerBefore,
          MultiSigWalletWithDailyLimit.options.address
        )

        // accept new owner from multi sig now

        // encode the accept ownership method
        const {data} = await governance.acceptOwnership.request()

        // submit via the wallet via first owner
        const {events} = await submitTransaction(
          MultiSigWalletWithDailyLimit,
          governance.address,
          data,
          owners[0]
        )

        const txId = events.Submission.returnValues.transactionId

        // confirm tx on the multi sig wallet from different owner
        await confirmTransaction(
          MultiSigWalletWithDailyLimit,
          txId,
          owners[1]
        )

        // should be empty now
        const newOwnerAfter = await governance.newOwner.call()
        assert.strictEqual(
          newOwnerAfter,
          '0x0000000000000000000000000000000000000000'
        )

        // finally new owner should be the multi sig wallet
        const finalOwner = await governance.owner.call()
        assert.strictEqual(
          finalOwner,
          MultiSigWalletWithDailyLimit.options.address
        )
      })
    })
  })
})
