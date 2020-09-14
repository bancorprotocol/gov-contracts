const MultiSigWalletWithDailyLimitArtifact = require("./artifacts/MultiSigWalletWithDailyLimit.json")

export const deployMultiSig = async (
  web3: any,
  owners: string[],
  requiredSignatures: string,
  limit: string,
  deployer: string
): Promise<any> => {
  const tmp = new web3.eth.Contract(MultiSigWalletWithDailyLimitArtifact.abi)

  const MultiSigWalletWithDailyLimitInstance = await tmp
    .deploy({
      data: MultiSigWalletWithDailyLimitArtifact.unlinked_binary,
      arguments: [
        owners,
        requiredSignatures,
        limit
      ]
    })
    .send({
      from: deployer,
      gas: 3000000
    })

  return MultiSigWalletWithDailyLimitInstance
}

export const submitTransaction = async (
  wallet: any,
  target: string,
  data: string,
  member: string
) => {
  const args = [
    // contract to call
    target,
    0, // value in ether
    // transaction to invoke on target contract encoded
    data
  ]

  // call submit tx with given payload
  const tx = await wallet.methods
    .submitTransaction(
      ...args
    )
    .send({
      from: member,
      gas: 200000
    })

  return tx
}

export const confirmTransaction = async (
  wallet: any,
  txId: string,
  member: string
) => {

  // call submit tx with given payload
  const tx = await wallet.methods
    .confirmTransaction(txId)
    .send({
      from: member,
      gas: 200000
    })

  return tx
}