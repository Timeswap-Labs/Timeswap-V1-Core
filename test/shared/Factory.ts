import { ethers } from 'hardhat'
import constants from './Constants'

import type { TimeswapFactory as Factory } from '../../typechain/TimeswapFactory'

export async function factoryInit(): Promise<Factory> {
  const signers = await ethers.getSigners()

  const factoryContractFactory = await ethers.getContractFactory('TimeswapFactory')
  const factory = (await factoryContractFactory.deploy(
    signers[10].address,
    constants.FEE,
    constants.PROTOCOL_FEE
  )) as Factory
  await factory.deployed()

  return factory
}

export default { factoryInit }
