const m = async (web3, time) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [time],
      id: new Date().getTime(),
    }, (err, _) => {
      if (err) {
        return reject(err);
      }
      const newBlockHash = web3.eth.getBlock("latest").hash;

      return resolve(newBlockHash);
    });
  });
}

export const mine = async (web3, times) => {
  for (let i = 0; i < times; i++) {
    await m(web3, Date.now())
  }
}

export const timeTravel = async (web3, to) => {
  await m(web3, to)
}
