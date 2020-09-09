contract("YearnGovernance", async (accounts) => {
  const YearnGovernance = artifacts.require("YearnGovernance");
  const TestToken = artifacts.require("TestToken");
  const decimals = 1e18

  let instance: any;
  let token: any;
  let vote: any;

  const governor = accounts[0]
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
      governor,
      token.address,
      vote.address
    );
  })

  const propose = async (): Promise<string> => {
    const amt = 2 * decimals
    // allow governance spend vote tokens
    await vote.approve(
      instance.address,
      amt.toString(),
      {from: executor}
    )
    // stake
    await instance.stake(
      (amt).toString(),
      {from: executor}
    )

    const proposalId = "0x53F84dBC77640F9AB0e22ACD12294a2a5f529a8a"
    const proposalCount = (await instance.proposalCount.call()).toNumber()

    // propose
    const {logs} = await instance.propose(
      proposalId,
      web3.utils.keccak256(proposalId),
      {from: executor}
    )

    assert.strictEqual(logs[0].args.id.toString(), (proposalCount + 1).toString())

    return logs[0].args.id.toString()
  }

  describe("#voteFor()", async () => {
    it("should vote for a proposal", async () => {
      const proposalId = await propose()

      console.log(proposalId)

      await instance.voteFor(
        proposalId,
        {from: executor}
      )
    })
  })
})
