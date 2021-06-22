import chai from 'chai'
import helper from './Helper'

import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { TimeswapFactory } from '../typechain/TimeswapFactory'
import { TimeswapPool } from '../typechain/TimeswapPool'
import { Insurance } from '../typechain/Insurance'
import { Bond } from '../typechain/Bond'
import { CollateralizedDebt } from '../typechain/CollateralizedDebt'
import { TestToken } from '../typechain/TestToken'

chai.use(solidity)
const { expect } = chai
const { now } = helper

const transactionFee = 100n
const protocolFee = 100n

const duration = 86400n

let accounts: SignerWithAddress[]
let timeswapFactory: TimeswapFactory
let timeswapPool: TimeswapPool
let insurance: Insurance
let bond: Bond
let collateralizedDebt: CollateralizedDebt

let feeTo: string
let feeToSetter: SignerWithAddress

const deployTry = async (desiredTransactionFee: bigint, desiredProtocolFee: bigint) => {
  accounts = await ethers.getSigners()

  const timeswapPoolFactory = await ethers.getContractFactory('TimeswapPool')
  timeswapPool = (await timeswapPoolFactory.deploy()) as TimeswapPool
  await timeswapPool.deployed()

  const bondFactory = await ethers.getContractFactory('Bond')
  bond = (await bondFactory.deploy()) as Bond
  await bond.deployed()

  const insuranceFactory = await ethers.getContractFactory('Insurance')
  insurance = (await insuranceFactory.deploy()) as Insurance
  await insurance.deployed()

  const collateralizedDebtFactory = await ethers.getContractFactory('CollateralizedDebt')
  collateralizedDebt = (await collateralizedDebtFactory.deploy()) as CollateralizedDebt
  await collateralizedDebt.deployed()

  feeTo = accounts[1].address
  feeToSetter = accounts[2]

  const timeswapFactoryFactory = await ethers.getContractFactory('TimeswapFactory')
  timeswapFactory = (await timeswapFactoryFactory.deploy(
    feeTo,
    feeToSetter.address,
    timeswapPool.address,
    bond.address,
    insurance.address,
    collateralizedDebt.address,
    desiredTransactionFee,
    desiredProtocolFee
  )) as TimeswapFactory
  await timeswapFactory.deployed()
}

const deploy = async () => await deployTry(transactionFee, protocolFee)

describe('constructor', () => {
  describe('success case', () => {
    before(async () => {
      await deploy()
    })

    it('Should be a proper address', async () => {
      expect(timeswapFactory.address).to.be.properAddress
    })

    it('Should have the correct feeTo', async () => {
      const result = await timeswapFactory.feeTo()

      expect(result).to.equal(feeTo)
    })

    it('Should have the correct feeToSetter', async () => {
      const result = await timeswapFactory.feeToSetter()

      expect(result).to.equal(feeToSetter.address)
    })

    it('Should have the correct timeswap pool', async () => {
      const result = await timeswapFactory.pool()

      expect(result).to.equal(timeswapPool.address)
    })

    it('Should have the correct bond', async () => {
      const result = await timeswapFactory.bond()

      expect(result).to.equal(bond.address)
    })

    it('Should have the correct insurance', async () => {
      const result = await timeswapFactory.insurance()

      expect(result).to.equal(insurance.address)
    })

    it('Should have the correct collateralizedDebt', async () => {
      const result = await timeswapFactory.collateralizedDebt()

      expect(result).to.equal(collateralizedDebt.address)
    })

    it('Should have the correct transaction fee', async () => {
      const resultHex = await timeswapFactory.transactionFee()
      const result = resultHex

      expect(result).to.equal(transactionFee)
    })

    it('Should have the correct protocol fee', async () => {
      const resultHex = await timeswapFactory.protocolFee()
      const result = resultHex

      expect(result).to.equal(protocolFee)
    })
  })

  describe('fail case', () => {
    it('Should revert if incorrect transaction fee', async () => {
      const wrongTransactionFee = BigInt(10000)

      await expect(deployTry(wrongTransactionFee, protocolFee)).to.be.reverted
    })

    it('Should revert if incorrect protocol fee', async () => {
      const wrongProtocolFee = BigInt(10000)

      await expect(deployTry(transactionFee, wrongProtocolFee)).to.be.reverted
    })
  })
})

describe('createPool', () => {
  const decimals1 = 8
  const decimals2 = 18

  let testToken1: TestToken
  let testToken2: TestToken

  let maturity: bigint

  before(async () => {
    await deploy()

    const testTokenFactory = await ethers.getContractFactory('TestToken')

    testToken1 = (await testTokenFactory.deploy(decimals1)) as TestToken
    await testToken1.deployed()

    testToken2 = (await testTokenFactory.deploy(decimals2)) as TestToken
    await testToken2.deployed()

    maturity = (await now()) + duration

    await timeswapFactory.createPool(testToken1.address, testToken2.address, maturity)
  })

  describe('success case', () => {
    it('Should create a pool', async () => {
      const result = await timeswapFactory.getPool(testToken1.address, testToken2.address, maturity)

      expect(result).to.be.properAddress
    })
  })

  describe('fail case', () => {
    it('Should revert if pool already exist', async () => {
      await expect(timeswapFactory.createPool(testToken1.address, testToken2.address, maturity)).to.be.reverted
    })
  })
})

describe('setFeeTo', () => {
  let newFeeTo: string

  beforeEach(async () => {
    await deploy()

    newFeeTo = accounts[3].address
  })

  describe('success case', () => {
    it('Should change feeTo by feeToSetter', async () => {
      await timeswapFactory.connect(feeToSetter).setFeeTo(newFeeTo)

      const result = await timeswapFactory.feeTo()

      expect(result).to.equal(newFeeTo)
    })
  })

  describe('fail case', () => {
    it('Should revert if not changed by feeToSetter', async () => {
      await expect(timeswapFactory.setFeeTo(newFeeTo)).to.be.reverted
    })
  })
})

describe('setFeeToSetter', () => {
  let newFeeToSetter: string

  beforeEach(async () => {
    await deploy()

    newFeeToSetter = accounts[3].address
  })

  describe('success case', () => {
    it('Should change feeToSetter by feeToSetter', async () => {
      await timeswapFactory.connect(feeToSetter).setFeeToSetter(newFeeToSetter)

      const result = await timeswapFactory.feeToSetter()

      expect(result).to.equal(newFeeToSetter)
    })
  })

  describe('fail case', () => {
    it('Should revert if not changed by feeToSetter', async () => {
      await expect(timeswapFactory.setFeeToSetter(newFeeToSetter)).to.be.reverted
    })
  })
})
