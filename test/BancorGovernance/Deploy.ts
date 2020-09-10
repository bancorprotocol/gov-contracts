contract("BancorGovernance", async () => {
  const BancorGovernance = artifacts.require("BancorGovernance");

  it("should instantiate", async () => {
    const instance = await BancorGovernance.deployed();
    assert.exists(instance)
  })
})
