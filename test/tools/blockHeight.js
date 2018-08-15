module.exports = {
     mineNBlocks: async n => {
        for (let i = 0; i < n; i++) {
            await mineOneBlock()
        }
    }
}

const mineOneBlock =  async () => {
    await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: 0,
    })
}
