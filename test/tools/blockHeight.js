module.exports = {
     mineNBlocks: async n => {
        for (let i = 0; i < n; i++) {
            await mineOneBlock()
        }
    }
}

const mineOneBlock =  async () => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            params: [],
            id: 0,
        },(error,result) => {
            if(error) reject()
            resolve(result)
        })
    })

}
