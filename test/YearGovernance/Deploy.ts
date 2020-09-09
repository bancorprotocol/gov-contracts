contract("YearnGovernance", async () => {
  const YearnGovernance = artifacts.require("YearnGovernance");

  it("should instantiate", async () => {
    const instance = await YearnGovernance.deployed();
    assert.exists(instance)
  })
})
