const decimals = 1e18

export const stake = async (
  governance: any,
  vote: any,
  executor: string,
  amount: number
) => {
  const amountInWei = amount * decimals
  // allow governance spend vote tokens
  await vote.approve(
    governance.address,
    amountInWei.toString(),
    {from: executor}
  )
  // stake
  await governance.stake(
    amountInWei.toString(),
    {from: executor}
  )
}

export const propose = async (
  governance: any,
  executor: string,
  contractToExecute: string = "0x53F84dBC77640F9AB0e22ACD12294a2a5f529a8a"
): Promise<string> => {
  const proposalCountBefore = (await governance.proposalCount.call()).toNumber()

  // propose
  const {logs} = await governance.propose(
    contractToExecute,
    web3.utils.keccak256(contractToExecute),
    {from: executor}
  )

  assert.strictEqual(
    logs[0].args._id.toNumber(),
    proposalCountBefore
  )

  const proposalCountAfter = (await governance.proposalCount.call()).toNumber()
  assert.strictEqual(
    proposalCountAfter,
    proposalCountBefore + 1
  )

  return logs[0].args._id.toString()
}
