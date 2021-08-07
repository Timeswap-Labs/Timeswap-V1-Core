import { ethers } from 'hardhat'

const advanceTime = async (time: number) => {
  await ethers.provider.send('evm_increaseTime', [time])
}

export const setTime = async (time: number) => {
  await ethers.provider.send('evm_setNextBlockTimestamp', [time])
}

const advanceBlock = async () => {
  const block = await getBlock('latest')
  return block.hash
}

export const advanceTimeAndBlock = async (time: number) => {
  await advanceTime(time)
  await advanceBlock()
}

export const now = async () => {
  const block = await getBlock('latest')
  return BigInt(block.timestamp)
}

const getBlock = async (blockHashOrBlockTag: string) => {
  const block = await ethers.provider.getBlock(blockHashOrBlockTag)
  return block
}

export const getTimestamp = async (blockHash: string) => {
  const block = await getBlock(blockHash)
  return block.timestamp
}

export default {
  now,
  advanceTimeAndBlock,
  getTimestamp,
  setTime,
}
