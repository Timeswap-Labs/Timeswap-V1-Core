import { ethers } from 'hardhat'
import { BigNumber } from "@ethersproject/bignumber";
import Decimal from "decimal.js";

export function pseudoRandomBigInt(maxUint: BigNumber): bigint {
    return BigInt((BigNumber.from(new Decimal(maxUint.toString()).mul(Math.random().toString()).round().toString())).toString());
  }

async function advanceTime(time: number) {
  await ethers.provider.send('evm_increaseTime', [time])
}

export async function setTime(time: number) {
  await ethers.provider.send('evm_setNextBlockTimestamp', [time])
}

async function advanceBlock() {
  const block = await getBlock('latest')
  return block.hash
}

export async function advanceTimeAndBlock(time: number) {
  await advanceTime(time)
  await advanceBlock()
}

export async function now(): Promise<bigint> {
  const block = await getBlock('latest')
  return BigInt(block.timestamp)
}

export async function getBlock(blockHashOrBlockTag: string) {
  const block = await ethers.provider.getBlock(blockHashOrBlockTag)
  return block
}

export async function getTimestamp(blockHash: string): Promise<bigint> {
  const block = await getBlock(blockHash)
  return BigInt(block.timestamp)
}

export default {
  now,
  advanceTimeAndBlock,
  getBlock,
  getTimestamp,
  setTime,
  pseudoRandomBigInt
}
