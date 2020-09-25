const sendRPCCall = async (
  web3: any,
  method: string,
  parameters: any[] = []
) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: method,
        params: parameters,
        id: new Date().getTime(),
      },
      (err: Error, _: any) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      }
    )
  })
}

export const mine = async (web3: any, times: number = 1) => {
  for (let i = 0; i < times; i++) {
    await sendRPCCall(web3, "evm_mine")
  }
}

export const timeTravel = async (web3: any, seconds: number) => {
  await sendRPCCall(web3, "evm_increaseTime", [seconds])
}
