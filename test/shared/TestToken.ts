import { ethers } from 'hardhat'

import type { TestToken } from '../../typechain/TestToken'

export const testTokenNew = async (value: bigint) => {
  const testTokenFactory = await ethers.getContractFactory('TestToken')
  const testToken = (await testTokenFactory.deploy(value)) as TestToken
  await testToken.deployed()

  return testToken
}
