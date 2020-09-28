// @ts-ignore
import * as truffleAssert from "truffle-assertions"
import { utils } from "ethers"

contract("BancorGovernance", async () => {
  const BancorGovernance = artifacts.require("BancorGovernance")

  it("should instantiate", async () => {
    const instance = await BancorGovernance.deployed()
    assert.exists(instance)
  })

  it("should instantiate fail if token is 0", async () => {
    await truffleAssert.fails(
      // deploy
      BancorGovernance.new("0x0000000000000000000000000000000000000000"),
      truffleAssert.ErrorType.REVERT,
      "ERR_NO_TOKEN"
    )
  })
})
