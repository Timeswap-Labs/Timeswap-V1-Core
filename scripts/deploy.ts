import * as dotenv from 'dotenv'

import { run, ethers } from 'hardhat'

import { TimeswapFactory } from '../typechain/TimeswapFactory'
import { TimeswapPool } from '../typechain/TimeswapPool'
import { Insurance } from '../typechain/Insurance'
import { Bond } from '../typechain/Bond'
import { CollateralizedDebt } from '../typechain/CollateralizedDebt'

dotenv.config()

const setter = process.env.SETTER_ADDRESS
const transactionFee = 30n
const protocolFee = 30n

async function main() {
  await run('compile')

  const timeswapPoolFactory = await ethers.getContractFactory('TimeswapPool')
  const timeswapPool = (await timeswapPoolFactory.deploy()) as TimeswapPool
  await timeswapPool.deployed()

  const bondFactory = await ethers.getContractFactory('Bond')
  const bond = (await bondFactory.deploy()) as Bond
  await bond.deployed()

  const insuranceFactory = await ethers.getContractFactory('Insurance')
  const insurance = (await insuranceFactory.deploy()) as Insurance
  await insurance.deployed()

  const collateralizedDebtFactory = await ethers.getContractFactory('CollateralizedDebt')
  const collateralizedDebt = (await collateralizedDebtFactory.deploy()) as CollateralizedDebt
  await collateralizedDebt.deployed()

  const timeswapFactoryFactory = await ethers.getContractFactory('TimeswapFactory')
  const timeswapFactory = (await timeswapFactoryFactory.deploy(
    setter,
    setter,
    timeswapPool.address,
    insurance.address,
    bond.address,
    collateralizedDebt.address,
    transactionFee,
    protocolFee
  )) as TimeswapFactory
  await timeswapFactory.deployed()

  console.log('Timeswap Factory deployed to: ', timeswapFactory.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
