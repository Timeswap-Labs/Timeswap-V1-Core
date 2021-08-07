import { ethers } from 'hardhat'
import constants from './Constants'

import type { Factory } from '../../typechain/Factory'

export async function factoryInit(): Promise<Factory> {
  const signers = await ethers.getSigners()

  const factoryContractFactory = await ethers.getContractFactory('Factory')
  const factory = (await factoryContractFactory.deploy(
    signers[0].address,
    constants.FEE,
    constants.PROTOCOL_FEE
  )) as Factory
  await factory.deployed()

  return factory
}

export default { factoryInit }
