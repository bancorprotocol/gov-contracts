const YearnGovernance = artifacts.require("YearnGovernance");

contract("YearnGovernance", async (accounts) => {
  it("should instantiate", async () => {
    const instance = await YearnGovernance.deployed();
    assert.exists(instance)
  })

  describe("#register()", () => {
    it("should register", async () => {
      const instance = await YearnGovernance.deployed();
      await instance.register()
    })

    it("should not register twice", async () => {
      const instance = await YearnGovernance.deployed();
      const acc = accounts[1]
      await instance.register({from: acc})
      try {
        await instance.register({from: acc})
        assert.fail("registering twice should fail!")
      } catch {
      }
    })
  })
})
