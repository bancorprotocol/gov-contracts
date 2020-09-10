contract("YearnGovernance", async (accounts) => {
  const YearnGovernance = artifacts.require("YearnGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let instance: any;
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
    instance = await YearnGovernance.new(
      token.address,
      vote.address
    );
  })

  describe("#stake()", async () => {
    it("should be able to stake 1", async () => {
      const amt = 2 * decimals
      // allow governance to spend vote tokens
      await vote.approve(instance.address, amt.toString(), {from: executor})
      // stake
      await instance.stake((2 * decimals).toString(), {from: executor})
    })

    it("should not be able to stake 0", async () => {
      try {
        // stake
        await instance.stake((0).toString(), {from: executor})
        assert.fail('staking with 0 was possible')
      } catch {
      }
    })
  })
})
