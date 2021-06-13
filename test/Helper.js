const { web3 } = require("hardhat");


const advanceTime = (time) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [time],
            id: new Date().getTime()
        }, (err, result) => {
            if (err) { return reject(err) }
            return (resolve(result))
        })
    })
}

const advanceBlock = () => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            id: new Date().getTime()
        }, (err, result) => {
            if (err) { return reject(err) }
            const newBlockHash = web3.eth.getBlock('latest').hash

            return resolve(newBlockHash)
        })
    })
}

const advanceTimeAndBlock = async (time) => {
    await advanceTime(Number(time))
    await advanceBlock()
}

const now = async () => {
    const block = await web3.eth.getBlock('latest')
    return BigInt(block.timestamp)
}

const getBlock = blockHash => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'eth_getBlockByHash',
            params: [blockHash, false],
            id: new Date().getTime()
        }, (err, result) => {
            if (err) { return reject(err) }

            return resolve(result)
        })
    })
}

const getTimestamp = async (blockHash) => {
    const block = await getBlock(blockHash)
    return web3.utils.hexToNumber(block.result.timestamp)
}

module.exports = {
    now,
    advanceTimeAndBlock,
    getTimestamp
}