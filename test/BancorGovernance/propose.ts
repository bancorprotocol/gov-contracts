import {stake} from "./utils";

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");
  const decimals = 1e18

  let governance: any;
  let token: any;
  let vote: any;

  const executor = accounts[2]

  before(async () => {
    token = await TestToken.new()
    vote = await TestToken.new()

    // get the executor some tokens
    await token.mint(executor, (100 * decimals).toString())
    await vote.mint(executor, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      token.address,
      vote.address
    );
  })

  describe("#propose()", async () => {
    it("should propose", async () => {
      // stake
      await stake(
        governance,
        vote,
        executor,
        2
      )

      const proposalId = "0x53F84dBC77640F9AB0e22ACD12294a2a5f529a8a"
      const proposalCount = (await governance.proposalCount.call()).toNumber()

      // propose
      const {logs} = await governance.propose(
        proposalId,
        web3.utils.keccak256(proposalId),
        {from: executor}
      )

      assert.strictEqual(
        logs[0].args.id.toNumber(),
        proposalCount + 1
      )
    })
  })
})
