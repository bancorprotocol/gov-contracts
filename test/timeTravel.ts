const m = async (web3: any, time: number) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [time],
      id: new Date().getTime(),
    }, (err: Error, _: any) => {
      if (err) {
        return reject(err);
      }
      const newBlockHash = web3.eth.getBlock("latest").hash;

      return resolve(newBlockHash);
    });
  });
}

export const mine = async (web3: any, times: number) => {
  for (let i = 0; i < times; i++) {
    await m(web3, Date.now())
  }
}

export const timeTravel = async (web3: any, to: number) => {
  await m(web3, to)
}
