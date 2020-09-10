const decimals = 1e18

export const stake = async (
  governance,
  vote,
  executor,
  amount
) => {
  const amt = amount * decimals
  // allow governance spend vote tokens
  await vote.approve(
    governance.address,
    amt.toString(),
    {from: executor}
  )
  // stake
  await governance.stake(
    (amt).toString(),
    {from: executor}
  )
}

export const propose = async (
  governance,
  vote,
  executor,
  contractToExecute = "0x53F84dBC77640F9AB0e22ACD12294a2a5f529a8a"
): Promise<string> => {
  const proposalCount = (await governance.proposalCount.call()).toNumber()

  // propose
  const {logs} = await governance.propose(
    contractToExecute,
    web3.utils.keccak256(contractToExecute),
    {from: executor}
  )

  assert.strictEqual(logs[0].args.id.toString(), (proposalCount + 1).toString())

  return logs[0].args.id.toString()
}
