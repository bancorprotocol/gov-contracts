import {stake} from "./utils";
// @ts-ignore
import * as truffleAssert from "truffle-assertions"

contract("BancorGovernance", async (accounts) => {
  const BancorGovernance = artifacts.require("BancorGovernance");
  const TestToken = artifacts.require("TestToken");

  const decimals = 1e18

  let governance: any;
  let govToken: any;

  const voter = accounts[2]

  before(async () => {
    govToken = await TestToken.new()

    // get voter some tokens
    await govToken.mint(voter, (100 * decimals).toString())
  })

  beforeEach(async () => {
    governance = await BancorGovernance.new(
      govToken.address
    );
  })

  describe("#stake()", async () => {
    it("should be able to stake 2", async () => {
      const amount = 2

      const votesBefore = (await governance.votesOf(voter)).toString()
      assert.strictEqual(
        votesBefore,
        (0).toString()
      )

      await stake(
        governance,
        govToken,
        voter,
        amount
      )

      const votesAfter = (await governance.votesOf(voter)).toString()
      assert.strictEqual(
        votesAfter,
        (amount * decimals).toString()
      )
    })

    it("should be able to stake 2 times 2 and have 4", async () => {
      const amount = 2

      const votesBefore = (await governance.votesOf(voter)).toString()
      assert.strictEqual(
        votesBefore,
        (0).toString()
      )
      await stake(
        governance,
        govToken,
        voter,
        amount
      )

      const votesAfter = (await governance.votesOf(voter)).toString()
      assert.strictEqual(
        votesAfter,
        (amount * decimals).toString()
      )
      await stake(
        governance,
        govToken,
        voter,
        amount
      )

      const votesAfterSecond = (await governance.votesOf(voter)).toString()
      assert.strictEqual(
        votesAfterSecond,
        (amount * 2 * decimals).toString()
      )

    })

    it("should not be able to stake 0", async () => {
      await truffleAssert.fails(
        // stake
        governance.stake(
          (0).toString(),
          {from: voter}
        ),
        truffleAssert.ErrorType.REVERT,
        "ERR_STAKE_ZERO"
      )
    })
  })
})
