import {stake} from "./utils";
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");
  const decimals = 1e18
  const contractToExecute = "0x53F84dBC77640F9AB0e22ACD12294a2a5f529a8a"

  let governance: any;
  let voteToken: any;

  const proposer = accounts[2]

  before(async () => {
    voteToken = await TestToken.new()

    // get the proposer some tokens
    await voteToken.mint(proposer, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      voteToken.address
    );
  })

  describe("#propose()", async () => {
    it("should propose", async () => {
      // stake
      await stake(
        governance,
        voteToken,
        proposer,
        2
      )

      const proposalCount = (await governance.proposalCount.call()).toNumber()

      // propose
      const {logs} = await governance.propose(
        contractToExecute,
        web3.utils.keccak256(contractToExecute),
        {from: proposer}
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
        proposer,
        1
      )

      await truffleAssert.fails(
        // vote against
        governance.propose(
          contractToExecute,
          web3.utils.keccak256(contractToExecute),
          {from: proposer}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_NOT_VOTE_MINIMUM"
      )
    })
  })
})
