import {stake} from "./utils";
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");
  const decimals = 1e18
  const contractToExecute = "0x53F84dBC77640F9AB0e22ACD12294a2a5f529a8a"

  let governance: any;
  let rewardToken: any;
  let voteToken: any;

  const executor = accounts[2]

  before(async () => {
    rewardToken = await TestToken.new()
    voteToken = await TestToken.new()

    // get the executor some tokens
    await voteToken.mint(executor, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      rewardToken.address,
      voteToken.address
    );
  })

  describe("#propose()", async () => {
    it("should propose", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        executor,
        2
      )

      const proposalCount = (await governance.proposalCount.call()).toNumber()

      // propose
      const {logs} = await governance.propose(
        contractToExecute,
        web3.utils.keccak256(contractToExecute),
        {from: executor}
      )

      assert.strictEqual(
        logs[0].args.id.toNumber(),
        proposalCount + 1
      )
    })

    it("should not be able to propose if not staked min amount", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        executor,
        1
      )

      await truffleAssert.fails(
        // vote against
        governance.propose(
          contractToExecute,
          web3.utils.keccak256(contractToExecute),
          {from: executor}
        ),
        truffleAssert.ErrorType.REVERT,
        "<voteMinimum"
      )
    })
  })
})
