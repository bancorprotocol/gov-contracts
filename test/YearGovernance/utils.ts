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
  executor
): Promise<string> => {
  const proposalId = "0x53F84dBC77640F9AB0e22ACD12294a2a5f529a8a"
  const proposalCount = (await governance.proposalCount.call()).toNumber()

  // propose
  const {logs} = await governance.propose(
    proposalId,
    web3.utils.keccak256(proposalId),
    {from: executor}
  )

  assert.strictEqual(logs[0].args.id.toString(), (proposalCount + 1).toString())

  return logs[0].args.id.toString()
}
