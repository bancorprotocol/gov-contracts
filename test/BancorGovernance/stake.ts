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
    await vote.mint(executor, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      token.address,
      vote.address
    );
  })

  describe("#stake()", async () => {
    it("should be able to stake 2", async () => {
      await stake(
        governance,
        vote,
        executor,
        2
      )
    })

    it("should not be able to stake 0", async () => {
      try {
        // stake
        await governance.stake((0).toString(), {from: executor})
        assert.fail('staking with 0 was possible')
      } catch {
      }
    })
  })
})
