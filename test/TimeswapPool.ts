import chai from 'chai'
import helper from './Helper'
import testCasesFile from './test-cases'

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
const { advanceTimeAndBlock, now, getTimestamp } = helper
const { testCases } = testCasesFile

const transactionFee = 30n
const protocolFee = 30n

const base = 10000n
const duration = 86400
const year = 31556926n

let accounts: SignerWithAddress[]
let timeswapFactory: TimeswapFactory
let timeswapPool: TimeswapPool
let insurance: Insurance
let bond: Bond
let collateralizedDebt: CollateralizedDebt

let feeTo: string
let feeToSetter: string
let receiver: SignerWithAddress

const decimals1 = 8
const decimals2 = 18

let testToken1: TestToken
let testToken2: TestToken

let maturity: bigint
let pool: TimeswapPool
let timestamp: number

const div = (x: bigint, y: bigint) => {
  return x / y
}

const divUp = (x: bigint, y: bigint) => {
  return x / y + 1n
}

const checkBigIntEquality = (result: bigint, expected: bigint) => {
  expect(String(result)).to.equal(String(expected))
}

const checkBigIntGte = (result: bigint, expected: bigint) => {
  const res = result >= expected ? true : false
  expect(res).to.equal(true)
}

const checkBigIntLte = (result: bigint, expected: bigint) => {
  const res = result <= expected ? true : false
  expect(res).to.equal(true)
}

const insuranceAt = async (address: string) => {
  const insuranceFactory = await ethers.getContractFactory('Insurance')
  const insurance = insuranceFactory.attach(address) as Insurance

  return insurance
}

const bondAt = async (address: string) => {
  const bondFactory = await ethers.getContractFactory('Bond')
  const bond = bondFactory.attach(address) as Bond

  return bond
}

const collateralizedDebtAt = async (address: string) => {
  const collateralizedDebtFactory = await ethers.getContractFactory('CollateralizedDebt')
  const collateralizedDebt = collateralizedDebtFactory.attach(address) as CollateralizedDebt

  return collateralizedDebt
}

const testTokenNew = async (value: number) => {
  const testTokenFactory = await ethers.getContractFactory('TestToken')
  const testToken = (await testTokenFactory.deploy(value)) as TestToken
  await testToken.deployed()

  return testToken
}

const deployTry = async (desiredMaturity: bigint) => {
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
  feeToSetter = accounts[2].address

  const timeswapFactoryFactory = await ethers.getContractFactory('TimeswapFactory')
  timeswapFactory = (await timeswapFactoryFactory.deploy(
    feeTo,
    feeToSetter,
    timeswapPool.address,
    bond.address,
    insurance.address,
    collateralizedDebt.address,
    transactionFee,
    protocolFee
  )) as TimeswapFactory
  await timeswapFactory.deployed()

  testToken1 = await testTokenNew(decimals1)
  testToken2 = await testTokenNew(decimals2)

  await timeswapFactory.createPool(testToken1.address, testToken2.address, desiredMaturity)

  pool = timeswapPoolFactory.attach(
    await timeswapFactory.getPool(testToken1.address, testToken2.address, maturity)
  ) as TimeswapPool
}

const deploy = async () => {
  maturity = (await now()) + BigInt(duration)
  await deployTry(maturity)

  receiver = accounts[3]
}

describe('initialize', () => {
  describe('success case', () => {
    before(async () => {
      await deploy()
    })

    it('Should be a proper address', async () => {
      expect(pool.address).to.be.properAddress
    })

    it('Should have a correct maturity', async () => {
      const result = (await pool.maturity()).toBigInt()

      checkBigIntEquality(result, maturity)
    })

    it('Should have a correct factory', async () => {
      const result = await pool.factory()

      expect(result).to.equal(timeswapFactory.address)
    })

    it('Should have a correct asset', async () => {
      const result = await pool.asset()

      expect(result).to.equal(testToken1.address)
    })

    it('Should have a correct collateral', async () => {
      const result = await pool.collateral()

      expect(result).to.equal(testToken2.address)
    })

    it('Should have a zero assetReserve', async () => {
      const result = (await pool.assetReserve()).toBigInt()
      checkBigIntEquality(result, 0n)
    })

    it('Should have a zero collateralReserve', async () => {
      const result = (await pool.collateralReserve()).toBigInt()
      checkBigIntEquality(result, 0n)
    })

    it('Should have a zero rateReserve', async () => {
      const result = (await pool.rateReserve()).toBigInt()
      checkBigIntEquality(result, 0n)
    })

    it('Should have a correct transaction fee', async () => {
      const result = (await pool.transactionFee()).toBigInt()
      checkBigIntEquality(result, transactionFee)
    })

    it('Should have a correct protocol fee', async () => {
      const result = (await pool.protocolFee()).toBigInt()
      checkBigIntEquality(result, protocolFee)
    })

    it('Should have a correct decimals', async () => {
      const decimals = BigInt(await testToken1.decimals())
      const result = BigInt(await pool.decimals())

      checkBigIntEquality(result, decimals)
    })

    it('Should have the correct symbol', async () => {
      const result = await pool.symbol()

      expect(result).to.equal('LP-TEST-TEST-' + maturity)
    })

    it('Should have the bond contract have the correct symbol', async () => {
      const bondContract = await bondAt(await pool.bond())

      const result = await bondContract.symbol()

      expect(result).to.equal('BD-TEST-TEST-' + maturity)
    })

    it('Should have the insurance contract have the correct symbol', async () => {
      const insuranceContract = await insuranceAt(await pool.insurance())

      const result = await insuranceContract.symbol()

      expect(result).to.equal('IN-TEST-TEST-' + maturity)
    })

    it('Should have the collateralized debt contract have the correct symbol', async () => {
      const collateralizedDebtContract = await collateralizedDebtAt(await pool.collateralizedDebt())

      const result = await collateralizedDebtContract.symbol()

      expect(result).to.equal('CD-TEST-TEST-' + maturity)
    })
  })

  describe('fail case', () => {
    it('Should revert if incorrect maturity', async () => {
      const wrongMaturity = (await now()) - BigInt(duration)

      await expect(deployTry(wrongMaturity)).to.be.reverted
    })
  })
})

const mint = async (
  to: string,
  assetIn: bigint,

  collateralIn: bigint,
  bondIncrease: bigint,
  insuranceIncrease: bigint
) => {
  await testToken1.mint(pool.address, assetIn)
  await testToken2.mint(pool.address, collateralIn)

  const transaction = await pool.mint(to, bondIncrease, insuranceIncrease)

  timestamp = await getTimestamp(transaction.blockHash!)
}

describe('mint', () => {
  describe('mint initial', () => {
    const tests = testCases.mintInitial
    tests.forEach((test, idx) => {
      const {
        assetIn,
        bondIncrease,
        insuranceIncrease,
        collateralIn,

        bondReceived,
        insuranceReceived,

        liquidityBurn,
        liquidityReceived,
        liquidityFeeTo,

        bondTotalSupply,
        insuranceTotalSupply,
        liquidityTotalSupply,
      } = test
      describe(`success case ${idx + 1}`, () => {
        before(async () => {
          await deploy()

          await mint(receiver.address, assetIn, collateralIn, bondIncrease, insuranceIncrease)
        })

        it('Should have receiver have correct amount of liquidity tokens', async () => {
          const result = (await pool.balanceOf(receiver.address)).toBigInt()
          checkBigIntEquality(result, liquidityReceived)
        })

        it('Should have receiver have correct amount of bond tokens', async () => {
          const bondERC20 = await bondAt(await pool.bond())
          const result = (await bondERC20.balanceOf(receiver.address)).toBigInt()

          checkBigIntEquality(result, bondReceived)
        })

        it('Should have receiver have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await insuranceAt(await pool.insurance())
          const result = (await insuranceERC20.balanceOf(receiver.address)).toBigInt()

          checkBigIntEquality(result, insuranceReceived)
        })

        it('Should have receiver have a correct collateralized debt token', async () => {
          const collateralizedDebtERC721 = await collateralizedDebtAt(await pool.collateralizedDebt())

          const tokenId = await collateralizedDebtERC721.totalSupply()
          const result = await collateralizedDebtERC721.ownerOf(tokenId)
          const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
          const resultDebt = resultHex.debt.toBigInt()
          const resultCollateral = resultHex.collateral.toBigInt()

          expect(result).to.equal(receiver.address)
          checkBigIntEquality(resultDebt, insuranceIncrease)
          checkBigIntEquality(resultCollateral, bondReceived)
        })

        it('Should have pool have a correct assets reserve and balance', async () => {
          const result = (await testToken1.balanceOf(pool.address)).toBigInt()
          const resultReserve = (await pool.assetReserve()).toBigInt()
          checkBigIntEquality(result, assetIn)
          checkBigIntEquality(resultReserve, assetIn)
        })

        it('Should have pool have correct collateral reserve and balance', async () => {
          const result = (await testToken2.balanceOf(pool.address)).toBigInt()
          const resultReserve = (await pool.collateralReserve()).toBigInt()

          checkBigIntEquality(result, collateralIn)
          checkBigIntEquality(resultReserve, collateralIn)
        })

        it('Should have pool have correct amount of bond tokens', async () => {
          const bondERC20 = await bondAt(await pool.bond())
          const result = (await bondERC20.balanceOf(pool.address)).toBigInt()

          checkBigIntEquality(result, bondIncrease)
        })

        it('Should have pool have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await insuranceAt(await pool.insurance())
          const result = (await insuranceERC20.balanceOf(pool.address)).toBigInt()

          checkBigIntEquality(result, insuranceIncrease)
        })

        it('Should burn 1000 liquidity tokens', async () => {
          const zero = '0x0000000000000000000000000000000000000000'
          const result = (await pool.balanceOf(zero)).toBigInt()

          checkBigIntEquality(result, liquidityBurn)
        })

        it('Should have factory receive correct amount of liquidity tokens', async () => {
          const result = (await pool.balanceOf(feeTo)).toBigInt()

          checkBigIntEquality(result, liquidityFeeTo)
        })

        it('Should have a correct rateReserve', async () => {
          const result = (await pool.rateReserve()).toBigInt()
          const rateReserve = div(insuranceIncrease * year, maturity - BigInt(timestamp))

          checkBigIntEquality(result, rateReserve)
        })

        it('Should have the correct bond total supply', async () => {
          const bondERC20 = await bondAt(await pool.bond())
          const result = (await bondERC20.totalSupply()).toBigInt()

          checkBigIntEquality(result, bondTotalSupply)
        })

        it('Should have the correct insurance total supply', async () => {
          const insuranceERC20 = await insuranceAt(await pool.insurance())
          const result = (await insuranceERC20.totalSupply()).toBigInt()

          checkBigIntEquality(result, insuranceTotalSupply)
        })

        it('Should have the correct liquidity total supply', async () => {
          const result = (await pool.totalSupply()).toBigInt()

          checkBigIntEquality(result, liquidityTotalSupply)
        })
      })

      describe(`fail case ${idx + 1}`, () => {
        beforeEach(async () => {
          await deploy()
        })

        it('Should revert if no asset input amount', async () => {
          const wrongAssetIn = 0n

          await expect(mint(receiver.address, wrongAssetIn, collateralIn, bondIncrease, insuranceIncrease)).to.be
            .reverted
        })

        it('Should revert if no collateral input amount', async () => {
          const wrongCollateralIn = 0n

          receiver = accounts[4]

          await expect(mint(receiver.address, assetIn, wrongCollateralIn, bondIncrease, insuranceIncrease)).to.be
            .reverted
        })

        it('Should revert if there is no bond output amount', async () => {
          const wrongBondIncrease = 0n

          await expect(mint(receiver.address, assetIn, collateralIn, wrongBondIncrease, insuranceIncrease)).to.be
            .reverted
        })

        it('Should revert if there is no insurance output amount', async () => {
          const wrongInsuranceIncrease = 0n

          await expect(mint(receiver.address, assetIn, collateralIn, bondIncrease, wrongInsuranceIncrease)).to.be
            .reverted
        })

        it('Should revert if pool matured', async () => {
          await advanceTimeAndBlock(duration)

          await expect(mint(receiver.address, assetIn, collateralIn, bondIncrease, insuranceIncrease)).to.be.reverted
        })
      })
    })
  })

  describe('mint proportional', () => {
    let rateReserve: bigint
    const tests = testCases.mintProportional
    tests.forEach((test, idx) => {
      const {
        assetReserve,
        bondReserve,
        insuranceReserve,
        collateralReserve,
        feeToBalance,

        assetIn,
        bondIncrease,
        insuranceIncrease,
        bondReceived,
        insuranceReceived,
        collateralIn,

        liquidityReceived,
        liquidityFeeTo,

        bondTotalSupplyBefore,
        insuranceTotalSupplyBefore,
        liquidityTotalSupplyBefore,
      } = test
      describe(`success case ${idx + 1}`, () => {
        before(async () => {
          await deploy()

          await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

          receiver = accounts[4]
          rateReserve = (await pool.rateReserve()).toBigInt()

          await mint(receiver.address, assetIn, collateralIn, bondIncrease, insuranceIncrease)
        })

        it('Should have receiver have correct amount of liquidity tokens', async () => {
          const result = (await pool.balanceOf(receiver.address)).toBigInt()

          checkBigIntEquality(result, liquidityReceived)
        })

        it('Should have receiver have correct amount of bond tokens', async () => {
          const bondERC20 = await bondAt(await pool.bond())
          const result = (await bondERC20.balanceOf(receiver.address)).toBigInt()

          checkBigIntEquality(result, bondReceived)
        })

        it('Should have receiver have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await insuranceAt(await pool.insurance())
          const result = (await insuranceERC20.balanceOf(receiver.address)).toBigInt()

          checkBigIntEquality(result, insuranceReceived)
        })

        it('Should have receiver have a correct collateralized debt token', async () => {
          const collateralizedDebtERC721 = await collateralizedDebtAt(await pool.collateralizedDebt())

          const tokenId = await collateralizedDebtERC721.totalSupply()
          const result = await collateralizedDebtERC721.ownerOf(tokenId)
          const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
          const resultDebt = resultHex.debt.toBigInt()
          const resultCollateral = resultHex.collateral.toBigInt()

          expect(result).to.equal(receiver.address)
          checkBigIntEquality(resultDebt, insuranceIncrease)
          checkBigIntEquality(resultCollateral, bondReceived)
        })

        it('Should have pool have a correct assets reserve and balance', async () => {
          const result = (await testToken1.balanceOf(pool.address)).toBigInt()
          const resultReserve = (await pool.assetReserve()).toBigInt()

          const assetBalance = assetReserve + assetIn

          checkBigIntEquality(result, assetBalance)
          checkBigIntEquality(resultReserve, assetBalance)
        })

        it('Should have pool have correct collateral reserve and balance', async () => {
          const result = (await testToken2.balanceOf(pool.address)).toBigInt()
          const resultReserve = (await pool.collateralReserve()).toBigInt()

          const collateralBalance = collateralReserve + collateralIn

          checkBigIntEquality(result, collateralBalance)
          checkBigIntEquality(resultReserve, collateralBalance)
        })

        it('Should have pool have correct amount of bond tokens', async () => {
          const bondERC20 = await bondAt(await pool.bond())

          const result = (await bondERC20.balanceOf(pool.address)).toBigInt()

          const bondBalance = bondReserve + bondIncrease

          checkBigIntEquality(result, bondBalance)
        })

        it('Should have pool have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await insuranceAt(await pool.insurance())

          const result = (await insuranceERC20.balanceOf(pool.address)).toBigInt()

          const insuranceBalance = insuranceReserve + insuranceIncrease

          checkBigIntEquality(result, insuranceBalance)
        })

        it('Should have factory receive correct amount of liquidity tokens', async () => {
          const result = (await pool.balanceOf(feeTo)).toBigInt()

          checkBigIntEquality(result, feeToBalance + liquidityFeeTo)
        })

        it('Should have a correct rateReserve', async () => {
          const result = (await pool.rateReserve()).toBigInt()
          const rateIncrease = divUp(rateReserve * (liquidityReceived + liquidityFeeTo), insuranceReserve)

          const newRateReserve = rateReserve + rateIncrease

          checkBigIntEquality(result, newRateReserve)
        })

        it('Should have the correct ratio on its asset reserves', async () => {
          const totalSupply = (await pool.totalSupply()).toBigInt()
          const ratioLiquidity = totalSupply / (liquidityReceived + liquidityFeeTo)

          const resultAsset = (await testToken1.balanceOf(pool.address)).toBigInt()
          const ratioAsset = resultAsset / assetIn

          checkBigIntGte(ratioLiquidity, ratioAsset)
        })

        it('Should have the correct ratio on its bond reserves', async () => {
          const totalSupply = (await pool.totalSupply()).toBigInt()
          const ratioLiquidity = totalSupply / (liquidityReceived + liquidityFeeTo)

          const bondERC20 = await bondAt(await pool.bond())

          const resultBond = (await bondERC20.balanceOf(pool.address)).toBigInt()
          const ratioBond = resultBond / bondIncrease

          checkBigIntGte(ratioLiquidity, ratioBond)
        })

        it('Should have the correct ratio on its insurance reserves', async () => {
          const totalSupply = (await pool.totalSupply()).toBigInt()
          const ratioLiquidity = totalSupply / (liquidityReceived + liquidityFeeTo)

          const insuranceERC20 = await insuranceAt(await pool.insurance())

          const resultInsurance = (await insuranceERC20.balanceOf(pool.address)).toBigInt()
          const ratioInsurance = resultInsurance / insuranceIncrease

          checkBigIntGte(ratioLiquidity, ratioInsurance)
        })

        it('Should have the correct bond total supply', async () => {
          const bondERC20 = await bondAt(await pool.bond())

          const result = (await bondERC20.totalSupply()).toBigInt()

          const bondTotalSupply = bondTotalSupplyBefore + bondIncrease + bondReceived

          checkBigIntEquality(result, bondTotalSupply)
        })

        it('Should have the correct insurance total supply', async () => {
          const insuranceERC20 = await insuranceAt(await pool.insurance())

          const result = (await insuranceERC20.totalSupply()).toBigInt()

          const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceIncrease + insuranceReceived

          checkBigIntEquality(result, insuranceTotalSupply)
        })

        it('Should have the correct liquidity total supply', async () => {
          const result = (await pool.totalSupply()).toBigInt()

          const liquidityTotalSupply = liquidityTotalSupplyBefore + liquidityReceived + liquidityFeeTo

          checkBigIntEquality(result, liquidityTotalSupply)
        })
      })

      describe(`fail case ${idx + 1}`, () => {
        beforeEach(async () => {
          await deploy()

          await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

          receiver = accounts[4]
        })

        it('Should revert if no asset input amount', async () => {
          const wrongAssetIn = 0n

          await expect(mint(receiver.address, wrongAssetIn, collateralIn, bondIncrease, insuranceIncrease)).to.be
            .reverted
        })

        it('Should revert if no collateral input amount', async () => {
          const wrongCollateralIn = 0n

          await expect(mint(receiver.address, assetIn, wrongCollateralIn, bondIncrease, insuranceIncrease)).to.be
            .reverted
        })

        it('Should revert if no bond output amount', async () => {
          const wrongBondIncrease = 0n

          await expect(mint(receiver.address, assetIn, collateralIn, wrongBondIncrease, insuranceIncrease)).to.be
            .reverted
        })

        it('Should revert if no insurance output amount', async () => {
          const wrongInsuranceIncrease = 0n

          await expect(mint(receiver.address, assetIn, collateralIn, bondIncrease, wrongInsuranceIncrease)).to.be
            .reverted
        })

        it('Should revert if collateral transferred is not enough', async () => {
          const wrongCollateralIn = collateralIn - 1n

          await expect(mint(receiver.address, assetIn, wrongCollateralIn, bondIncrease, insuranceIncrease)).to.be
            .reverted
        })

        it('Should revert if pool matured', async () => {
          await advanceTimeAndBlock(duration)

          await expect(mint(receiver.address, assetIn, collateralIn, bondIncrease, insuranceIncrease)).to.be.reverted
        })
      })
    })
  })
})

const burn = async (owner: SignerWithAddress, to: string, liquidityIn: bigint, collateralIn: bigint) => {
  await pool.connect(owner).transfer(pool.address, liquidityIn)
  await testToken2.mint(pool.address, collateralIn)

  const transaction = await pool.burn(to)

  timestamp = await getTimestamp(transaction.blockHash!)
}

describe('burn', () => {
  let rateReserve: bigint
  describe('burn before maturity', () => {
    const tests = testCases.burnBeforeMaturity
    tests.forEach((test, idx) => {
      const {
        assetReserve,
        bondReserve,
        insuranceReserve,
        collateralReserve,

        liquidityIn,
        bondReceived,
        insuranceReceived,

        bondTotalSupplyBefore,
        insuranceTotalSupplyBefore,
        liquidityTotalSupplyBefore,
        collateralIn,
        assetMax,
        assetReceived,
        collateralInExcessive,
        assetReceivedExcessive,
        collateralLockedExcessive,
      } = test
      describe(`success case ${idx + 1}`, async () => {
        describe('collateral locked is not excessive', () => {
          before(async () => {
            await deploy()

            await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

            const owner = accounts[3]
            receiver = accounts[4]

            rateReserve = (await pool.rateReserve()).toBigInt()

            await burn(owner, receiver.address, liquidityIn, collateralIn)
          })

          it('Should have receiver have correct amount of asset', async () => {
            const result = (await testToken1.balanceOf(receiver.address)).toBigInt()

            checkBigIntEquality(result, assetReceived)
          })

          it('Should have receiver have correct amount of bond tokens', async () => {
            const bondERC20 = await bondAt(await pool.bond())
            const result = (await bondERC20.balanceOf(receiver.address)).toBigInt()

            checkBigIntEquality(result, bondReceived)
          })

          it('Should have receiver have correct amount of insurance tokens', async () => {
            const insuranceERC20 = await insuranceAt(await pool.insurance())
            const result = (await insuranceERC20.balanceOf(receiver.address)).toBigInt()

            checkBigIntEquality(result, insuranceReceived)
          })

          it('Should have receiver have a correct collateralized debt token', async () => {
            const collateralizedDebtERC721 = await collateralizedDebtAt(await pool.collateralizedDebt())

            const tokenId = await collateralizedDebtERC721.totalSupply()
            const result = await collateralizedDebtERC721.ownerOf(tokenId)
            const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
            const resultDebt = resultHex.debt.toBigInt()
            const resultCollateral = resultHex.collateral.toBigInt()

            expect(result).to.equal(receiver.address)
            checkBigIntEquality(resultDebt, assetReceived)
            checkBigIntEquality(resultCollateral, collateralIn)
          })

          it('Should have pool have a correct assets', async () => {
            const result = (await testToken1.balanceOf(pool.address)).toBigInt()
            const resultReserve = (await pool.assetReserve()).toBigInt()
            const assetBalance = assetReserve - assetReceived

            checkBigIntEquality(result, assetBalance)
            checkBigIntEquality(resultReserve, assetBalance)
          })

          it('Should have pool have correct collateral', async () => {
            const result = (await testToken2.balanceOf(pool.address)).toBigInt()
            const resultReserve = (await pool.collateralReserve()).toBigInt()
            const collateralBalance = collateralReserve + collateralIn

            checkBigIntEquality(result, collateralBalance)
            checkBigIntEquality(resultReserve, collateralBalance)
          })

          it('Should have pool have correct amount of bond tokens', async () => {
            const bondERC20 = await bondAt(await pool.bond())

            const result = (await bondERC20.balanceOf(pool.address)).toBigInt()

            const bondBalance = bondReserve - bondReceived

            checkBigIntEquality(result, bondBalance)
          })

          it('Should have pool have correct amount of insurance tokens', async () => {
            const insuranceERC20 = await insuranceAt(await pool.insurance())

            const result = (await insuranceERC20.balanceOf(pool.address)).toBigInt()

            const insuranceBalance = insuranceReserve - insuranceReceived

            checkBigIntEquality(result, insuranceBalance)
          })

          it('Should have a correct rateReserve', async () => {
            const result = (await pool.rateReserve()).toBigInt()

            const rateDecrease = div(rateReserve * liquidityIn, liquidityTotalSupplyBefore)

            const newRateReserve = rateReserve - rateDecrease

            checkBigIntEquality(result, newRateReserve)
          })

          it('Should have the correct ratio on its bond reserves', async () => {
            const resultLiquidity = (await pool.balanceOf(receiver.address)).toBigInt()
            const ratioLiquidity = resultLiquidity / liquidityIn

            const bondERC20 = await bondAt(await pool.bond())

            const resultBond = (await bondERC20.balanceOf(pool.address)).toBigInt()
            const ratioBond = resultBond / bondReceived

            checkBigIntLte(ratioLiquidity, ratioBond)
          })

          it('Should have the correct ratio on its insurance reserves', async () => {
            const resultLiquidity = (await pool.balanceOf(receiver.address)).toBigInt()
            const ratioLiquidity = resultLiquidity / liquidityIn

            const insuranceERC20 = await insuranceAt(await pool.insurance())

            const resultInsurance = (await insuranceERC20.balanceOf(pool.address)).toBigInt()
            const ratioInsurance = resultInsurance / insuranceReceived

            checkBigIntLte(ratioLiquidity, ratioInsurance)
          })

          it('Should have the correct bond total supply', async () => {
            const bondERC20 = await bondAt(await pool.bond())

            const result = (await bondERC20.totalSupply()).toBigInt()

            checkBigIntEquality(result, bondTotalSupplyBefore)
          })

          it('Should have the correct insurance total supply', async () => {
            const insuranceERC20 = await insuranceAt(await pool.insurance())

            const result = (await insuranceERC20.totalSupply()).toBigInt()

            checkBigIntEquality(result, insuranceTotalSupplyBefore)
          })

          it('Should have the correct liquidity total supply', async () => {
            const result = (await pool.totalSupply()).toBigInt()

            const liquidityTotalSupply = liquidityTotalSupplyBefore - liquidityIn

            checkBigIntEquality(result, liquidityTotalSupply)
          })
        })

        describe('collateral locked is excessive', () => {
          const collateralIn = collateralInExcessive
          const collateralLocked = collateralLockedExcessive
          const assetReceived = assetReceivedExcessive

          before(async () => {
            await deploy()

            await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

            const owner = accounts[3]
            receiver = accounts[4]

            rateReserve = (await pool.rateReserve()).toBigInt()

            await burn(owner, receiver.address, liquidityIn, collateralIn)
          })

          it('Should have receiver have correct amount of asset', async () => {
            const result = (await testToken1.balanceOf(receiver.address)).toBigInt()

            checkBigIntEquality(result, assetReceived)
          })

          it('Should have receiver have correct amount of bond tokens', async () => {
            const bondERC20 = await bondAt(await pool.bond())

            const result = (await bondERC20.balanceOf(receiver.address)).toBigInt()

            checkBigIntEquality(result, bondReceived)
          })

          it('Should have receiver have correct amount of insurance tokens', async () => {
            const insuranceERC20 = await insuranceAt(await pool.insurance())

            const result = (await insuranceERC20.balanceOf(receiver.address)).toBigInt()

            checkBigIntEquality(result, insuranceReceived)
          })

          it('Should have receiver have a correct collateralized debt token', async () => {
            const collateralizedDebtERC721 = await collateralizedDebtAt(await pool.collateralizedDebt())

            const tokenId = await collateralizedDebtERC721.totalSupply()
            const result = await collateralizedDebtERC721.ownerOf(tokenId)
            const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
            const resultDebt = resultHex.debt.toBigInt()
            const resultCollateral = resultHex.collateral.toBigInt()

            expect(result).to.equal(receiver.address)
            checkBigIntEquality(resultDebt, assetReceived)
            checkBigIntEquality(resultCollateral, collateralLocked)
          })

          it('Should have pool have a correct assets', async () => {
            const result = (await testToken1.balanceOf(pool.address)).toBigInt()
            const resultReserve = (await pool.assetReserve()).toBigInt()

            const assetBalance = assetReserve - assetReceived

            checkBigIntEquality(result, assetBalance)
            checkBigIntEquality(resultReserve, assetBalance)
          })

          it('Should have pool have correct collateral', async () => {
            const result = (await testToken2.balanceOf(pool.address)).toBigInt()
            const resultReserve = (await pool.collateralReserve()).toBigInt()

            const collateralBalance = collateralReserve + collateralIn

            checkBigIntEquality(result, collateralBalance)
            checkBigIntEquality(resultReserve, collateralBalance)
          })

          it('Should have pool have correct amount of bond tokens', async () => {
            const bondERC20 = await bondAt(await pool.bond())

            const result = (await bondERC20.balanceOf(pool.address)).toBigInt()

            const bondBalance = bondReserve - bondReceived

            checkBigIntEquality(result, bondBalance)
          })

          it('Should have pool have correct amount of insurance tokens', async () => {
            const insuranceERC20 = await insuranceAt(await pool.insurance())

            const result = (await insuranceERC20.balanceOf(pool.address)).toBigInt()

            const insuranceBalance = insuranceReserve - insuranceReceived

            checkBigIntEquality(result, insuranceBalance)
          })

          it('Should have a correct invariance', async () => {
            const result = (await pool.rateReserve()).toBigInt()

            const rateDecrease = div(rateReserve * liquidityIn, liquidityTotalSupplyBefore)

            const newRateReserve = rateReserve - rateDecrease

            checkBigIntEquality(result, newRateReserve)
          })

          it('Should have the correct ratio on its asset reserve and balance', async () => {
            const resultLiquidity = (await pool.balanceOf(receiver.address)).toBigInt()
            const ratioLiquidity = resultLiquidity / liquidityIn

            const resultAsset = (await testToken1.balanceOf(pool.address)).toBigInt()
            const ratioAsset = resultAsset / assetReceived

            const resultAssetReserve = (await pool.assetReserve()).toBigInt()
            const ratioAssetReserve = resultAssetReserve / assetReceived

            checkBigIntLte(ratioLiquidity, ratioAsset)
            checkBigIntLte(ratioLiquidity, ratioAssetReserve)
          })

          it('Should have the correct ratio on its bond reserves', async () => {
            const resultLiquidity = (await pool.balanceOf(receiver.address)).toBigInt()
            const ratioLiquidity = resultLiquidity / liquidityIn

            const bondERC20 = await bondAt(await pool.bond())

            const resultBond = (await bondERC20.balanceOf(pool.address)).toBigInt()
            const ratioBond = resultBond / bondReceived

            checkBigIntLte(ratioLiquidity, ratioBond)
          })

          it('Should have the correct ratio on its insurance reserves', async () => {
            const resultLiquidity = (await pool.balanceOf(receiver.address)).toBigInt()
            const ratioLiquidity = resultLiquidity / liquidityIn

            const insuranceERC20 = await insuranceAt(await pool.insurance())

            const resultInsurance = (await insuranceERC20.balanceOf(pool.address)).toBigInt()
            const ratioInsurance = resultInsurance / insuranceReceived

            checkBigIntLte(ratioLiquidity, ratioInsurance)
          })

          it('Should have the correct bond total supply', async () => {
            const bondERC20 = await bondAt(await pool.bond())

            const result = (await bondERC20.totalSupply()).toBigInt()

            checkBigIntEquality(result, bondTotalSupplyBefore)
          })

          it('Should have the correct insurance total supply', async () => {
            const insuranceERC20 = await insuranceAt(await pool.insurance())

            const result = (await insuranceERC20.totalSupply()).toBigInt()

            checkBigIntEquality(result, insuranceTotalSupplyBefore)
          })

          it('Should have the correct liquidity total supply', async () => {
            const result = (await pool.totalSupply()).toBigInt()

            const liquidityTotalSupply = liquidityTotalSupplyBefore - liquidityIn

            checkBigIntEquality(result, liquidityTotalSupply)
          })
        })
      })

      describe(`fail case ${idx + 1}`, async () => {
        beforeEach(async () => {
          await deploy()

          await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

          rateReserve = (await pool.rateReserve()).toBigInt()
        })

        it('Should revert if insufficient input amount', async () => {
          await expect(burn(receiver, receiver.address, 0n, 0n)).to.be.reverted
        })
      })
    })
  })

  describe('burn after maturity', () => {
    const tests = testCases.burnAfterMaturity
    tests.forEach((test, idx) => {
      const {
        assetReserve,
        bondReserve,
        insuranceReserve,
        collateralReserve,

        liquidityIn,
        bondReceived,
        insuranceReceived,

        bondTotalSupplyBefore,
        insuranceTotalSupplyBefore,
        liquidityTotalSupplyBefore,
      } = test
      describe(`success case ${idx + 1}`, async () => {
        before(async () => {
          await deploy()

          await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

          const owner = accounts[3]
          receiver = accounts[4]

          await advanceTimeAndBlock(duration)

          await burn(owner, receiver.address, liquidityIn, 0n)
        })

        it('Should have receiver have correct amount of asset', async () => {
          const result = (await testToken1.balanceOf(receiver.address)).toBigInt()

          checkBigIntEquality(result, 0n)
        })

        it('Should have receiver have correct amount of bond tokens', async () => {
          const bondERC20 = await bondAt(await pool.bond())

          const result = (await bondERC20.balanceOf(receiver.address)).toBigInt()

          checkBigIntEquality(result, bondReceived)
        })

        it('Should have receiver have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await insuranceAt(await pool.insurance())

          const result = (await insuranceERC20.balanceOf(receiver.address)).toBigInt()

          checkBigIntEquality(result, insuranceReceived)
        })

        it('Should have pool have a correct assets', async () => {
          const result = (await testToken1.balanceOf(pool.address)).toBigInt()
          const resultReserve = (await pool.assetReserve()).toBigInt()

          checkBigIntEquality(result, assetReserve)
          checkBigIntEquality(resultReserve, assetReserve)
        })

        it('Should have pool have correct collateral', async () => {
          const result = (await testToken2.balanceOf(pool.address)).toBigInt()
          const resultReserve = (await pool.collateralReserve()).toBigInt()

          checkBigIntEquality(result, collateralReserve)
          checkBigIntEquality(resultReserve, collateralReserve)
        })

        it('Should have pool have correct amount of bond tokens', async () => {
          const bondERC20 = await bondAt(await pool.bond())

          const result = (await bondERC20.balanceOf(pool.address)).toBigInt()

          const bondBalance = bondReserve - bondReceived

          checkBigIntEquality(result, bondBalance)
        })

        it('Should have pool have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await insuranceAt(await pool.insurance())

          const result = (await insuranceERC20.balanceOf(pool.address)).toBigInt()

          const insuranceBalance = insuranceReserve - insuranceReceived

          checkBigIntEquality(result, insuranceBalance)
        })

        it('Should have the correct ratio on its bond reserves', async () => {
          const resultLiquidity = (await pool.balanceOf(receiver.address)).toBigInt()
          const ratioLiquidity = resultLiquidity / liquidityIn

          const bondERC20 = await bondAt(await pool.bond())

          const resultBond = (await bondERC20.balanceOf(pool.address)).toBigInt()
          const ratioBond = resultBond / bondReceived

          checkBigIntLte(ratioLiquidity, ratioBond)
        })

        it('Should have the correct ratio on its insurance reserves', async () => {
          const resultLiquidity = (await pool.balanceOf(receiver.address)).toBigInt()
          const ratioLiquidity = resultLiquidity / liquidityIn

          const insuranceERC20 = await insuranceAt(await pool.insurance())

          const resultInsurance = (await insuranceERC20.balanceOf(pool.address)).toBigInt()
          const ratioInsurance = resultInsurance / insuranceReceived

          checkBigIntLte(ratioLiquidity, ratioInsurance)
        })

        it('Should have the correct bond total supply', async () => {
          const bondERC20 = await bondAt(await pool.bond())

          const result = (await bondERC20.totalSupply()).toBigInt()

          checkBigIntEquality(result, bondTotalSupplyBefore)
        })

        it('Should have the correct insurance total supply', async () => {
          const insuranceERC20 = await insuranceAt(await pool.insurance())

          const result = (await insuranceERC20.totalSupply()).toBigInt()

          checkBigIntEquality(result, insuranceTotalSupplyBefore)
        })

        it('Should have the correct liquidity total supply', async () => {
          const result = (await pool.totalSupply()).toBigInt()

          const liquidityTotalSupply = liquidityTotalSupplyBefore - liquidityIn

          checkBigIntEquality(result, liquidityTotalSupply)
        })
      })

      describe(`fail case ${idx + 1}`, async () => {
        beforeEach(async () => {
          await deploy()

          await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

          rateReserve = (await pool.rateReserve()).toBigInt()

          await advanceTimeAndBlock(duration)
        })

        it('Should revert if insufficient input amount', async () => {
          await expect(burn(receiver, receiver.address, 0n, 0n)).to.be.reverted
        })
      })
    })
  })
})

const lend = async (to: string, assetIn: bigint, bondDecrease: bigint, rateDecrease: bigint) => {
  await testToken1.mint(pool.address, assetIn)

  const transaction = await pool.lend(to, bondDecrease, rateDecrease)

  timestamp = await getTimestamp(transaction.blockHash!)
}

describe('lend', () => {
  let rateReserve: bigint
  const tests = testCases.lend
  tests.forEach((test, idx) => {
    const {
      assetReserve,
      bondReserve,
      insuranceReserve,
      collateralReserve,
      assetIn,
      bondDecrease,
      bondTotalSupplyBefore,
      insuranceTotalSupplyBefore,
    } = test

    let rateDecrease: bigint

    let bondMint: bigint
    let insuranceDecrease: bigint
    let insuranceMint: bigint

    let invariance: bigint

    const calculate = () => {
      const bondDecreaseAdjusted = bondReserve * base - bondDecrease * (base + transactionFee)
      const rateDecreaseAdjusted = divUp(divUp(invariance * base * base, assetReserve + assetIn), bondDecreaseAdjusted)
      rateDecrease = div(rateReserve * base - rateDecreaseAdjusted, base + transactionFee)

      bondMint = div(div(bondDecrease * rateReserve, assetReserve) * (maturity - BigInt(timestamp)), year)

      insuranceDecrease = div(rateDecrease * (maturity - BigInt(timestamp)), year)
      insuranceMint = div(rateDecrease * (assetReserve + assetIn), rateReserve)
    }

    describe(`success case ${idx + 1}`, () => {
      before(async () => {
        await deploy()

        await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

        receiver = accounts[4]
        rateReserve = (await pool.rateReserve()).toBigInt()

        invariance = rateReserve * assetReserve * bondReserve
        calculate()

        await lend(receiver.address, assetIn, bondDecrease, rateDecrease)
      })

      it('Should have receiver have correct amount of bond tokens', async () => {
        const bondERC20 = await bondAt(await pool.bond())

        const result = (await bondERC20.balanceOf(receiver.address)).toBigInt()
        bondMint = div(div(bondDecrease * rateReserve, assetReserve) * (maturity - BigInt(timestamp)), year)
        const bondReceived = bondDecrease + bondMint
        checkBigIntEquality(result, bondReceived)
      })

      it('Should have receiver have correct amount of insurance tokens', async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance())
        const result = (await insuranceERC20.balanceOf(receiver.address)).toBigInt()
        insuranceDecrease = div(rateDecrease * (maturity - BigInt(timestamp)), year)
        insuranceMint = div(rateDecrease * (assetReserve + assetIn), rateReserve)
        const insuranceReceived = insuranceDecrease + insuranceMint

        checkBigIntEquality(result, insuranceReceived)
      })

      it('Should have pool have a correct assets reserve and balance', async () => {
        const result = (await testToken1.balanceOf(pool.address)).toBigInt()
        const resultReserve = (await pool.assetReserve()).toBigInt()

        const assetBalance = assetReserve + assetIn

        checkBigIntEquality(result, assetBalance)
        checkBigIntEquality(resultReserve, assetBalance)
      })

      it('Should have pool have correct collateral reserve and balance', async () => {
        const result = (await testToken2.balanceOf(pool.address)).toBigInt()
        const resultReserve = (await pool.collateralReserve()).toBigInt()

        checkBigIntEquality(result, collateralReserve)
        checkBigIntEquality(resultReserve, collateralReserve)
      })

      it('Should have pool have correct amount of bond tokens', async () => {
        const bondERC20 = await bondAt(await pool.bond())

        const result = (await bondERC20.balanceOf(pool.address)).toBigInt()

        const bondBalance = bondReserve - bondDecrease

        checkBigIntEquality(result, bondBalance)
      })

      it('Should have pool have correct amount of insurance tokens', async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance())

        const result = (await insuranceERC20.balanceOf(pool.address)).toBigInt()

        const insuranceBalance = insuranceReserve - insuranceDecrease

        checkBigIntEquality(result, insuranceBalance)
      })

      it('Should have the correct bond total supply', async () => {
        const bondERC20 = await bondAt(await pool.bond())

        const result = (await bondERC20.totalSupply()).toBigInt()
        const bondTotalSupply = bondTotalSupplyBefore + bondMint

        checkBigIntEquality(result, bondTotalSupply)
      })

      it('Should have the correct insurance total supply', async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance())

        const result = (await insuranceERC20.totalSupply()).toBigInt()

        const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceMint

        checkBigIntEquality(result, insuranceTotalSupply)
      })
    })

    describe(`fail case ${idx + 1}`, () => {
      beforeEach(async () => {
        await deploy()

        await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

        receiver = accounts[4]

        rateReserve = (await pool.rateReserve()).toBigInt()
        invariance = assetReserve * bondReserve * rateReserve

        calculate()
      })

      it('Should revert if no asset input amount', async () => {
        const wrongAssetIn = 0n

        await expect(lend(receiver.address, wrongAssetIn, bondDecrease, rateDecrease)).to.be.reverted
      })

      it('Should revert if pool matured', async () => {
        await advanceTimeAndBlock(duration)

        await expect(lend(receiver.address, assetIn, bondDecrease, rateDecrease)).to.be.reverted
      })
    })
  })
})

const borrow = async (
  to: string,
  assetReceived: bigint,
  bondIncrease: bigint,
  rateIncrease: bigint,
  collateralIn: bigint
) => {
  await testToken2.mint(pool.address, collateralIn)
  const transaction = await pool.borrow(to, assetReceived, bondIncrease, rateIncrease)

  timestamp = await getTimestamp(transaction.blockHash!)
}

describe('borrow', () => {
  const tests = testCases.borrow
  tests.forEach((test, idx) => {
    const {
      assetReserve,
      bondReserve,
      insuranceReserve,
      collateralReserve,
      assetReceived,
      bondIncrease,
      bondTotalSupplyBefore,
      insuranceTotalSupplyBefore,
    } = test

    let rateReserve: bigint

    let rateIncrease: bigint

    let collateralLocked: bigint

    let insuranceIncrease: bigint
    let debtRequired: bigint

    let invariance: bigint

    const calculate = () => {
      const bondIncreaseAdjusted = bondReserve * base + bondIncrease * (base - transactionFee)
      const rateIncreaseAdjusted = divUp(
        divUp(invariance * base * base, assetReserve - assetReceived),
        bondIncreaseAdjusted
      )

      rateIncrease = divUp(rateIncreaseAdjusted - rateReserve * base, base - transactionFee)

      const bondMax = div(assetReceived * bondReserve, assetReserve - assetReceived)
      const bondMaxUp = divUp(assetReceived * bondReserve, assetReserve - assetReceived)

      collateralLocked = divUp(bondMaxUp * bondIncrease, bondMax - bondIncrease)
      collateralLocked = divUp(collateralLocked * rateReserve, assetReserve)
      // collateralLocked = divUp(
      //   BigInt(collateralLocked) * BigInt(maturity - timestamp),
      //   BigInt(year)
      // )
      collateralLocked += bondMaxUp

      insuranceIncrease = divUp(rateIncrease * (maturity - BigInt(timestamp)), year)

      const rateMax = div(assetReceived * rateReserve, assetReserve - assetReceived)
      const rateMaxUp = divUp(assetReceived * rateReserve, assetReserve - assetReceived)
      debtRequired = divUp(rateMaxUp * rateIncrease, rateMax - rateIncrease)
      debtRequired = divUp(debtRequired * (maturity - BigInt(timestamp)), year)
      debtRequired = debtRequired + assetReceived
    }

    describe(`success case ${idx + 1}`, () => {
      before(async () => {
        await deploy()

        await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

        receiver = accounts[4]

        rateReserve = (await pool.rateReserve()).toBigInt()
        invariance = assetReserve * bondReserve * rateReserve

        calculate()

        await borrow(receiver.address, assetReceived, bondIncrease, rateIncrease, collateralLocked)
        calculate()
      })

      it('Should have receiver have correct amount of asset', async () => {
        const result = (await testToken1.balanceOf(receiver.address)).toBigInt()

        checkBigIntEquality(result, assetReceived)
      })

      it('Should have receiver have a correct collateralized debt token', async () => {
        const collateralizedDebtERC721 = await collateralizedDebtAt(await pool.collateralizedDebt())
        const tokenId = await collateralizedDebtERC721.totalSupply()
        const result = await collateralizedDebtERC721.ownerOf(tokenId)
        const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
        const resultDebt = resultHex.debt.toBigInt()
        const resultCollateral = resultHex.collateral.toBigInt()

        expect(result).to.equal(receiver.address)
        checkBigIntLte(resultDebt, debtRequired)
        checkBigIntLte(resultCollateral, collateralLocked)
      })

      it('Should have pool have a correct assets', async () => {
        const result = (await testToken1.balanceOf(pool.address)).toBigInt()
        const resultReserve = (await pool.assetReserve()).toBigInt()

        const assetBalance = assetReserve - assetReceived

        checkBigIntEquality(result, assetBalance)
        checkBigIntEquality(resultReserve, assetBalance)
      })

      it('Should have pool have correct collateral', async () => {
        const result = (await testToken2.balanceOf(pool.address)).toBigInt()
        const resultReserve = (await pool.collateralReserve()).toBigInt()
        const collateralBalance = collateralReserve + collateralLocked

        checkBigIntEquality(result, collateralBalance)
        checkBigIntEquality(resultReserve, collateralBalance)
      })

      it('Should have pool have correct amount of bond tokens', async () => {
        const bondERC20 = await bondAt(await pool.bond())

        const result = (await bondERC20.balanceOf(pool.address)).toBigInt()

        const bondBalance = bondReserve + bondIncrease

        checkBigIntEquality(result, bondBalance)
      })

      it('Should have pool have correct amount of insurance tokens', async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance())

        const result = (await insuranceERC20.balanceOf(pool.address)).toBigInt()

        const insuranceBalance = insuranceReserve + insuranceIncrease

        checkBigIntEquality(result, insuranceBalance)
      })

      it('Should have the correct bond total supply', async () => {
        const bondERC20 = await bondAt(await pool.bond())

        const result = (await bondERC20.totalSupply()).toBigInt()
        const bondTotalSupply = bondTotalSupplyBefore + bondIncrease

        checkBigIntEquality(result, bondTotalSupply)
      })

      it('Should have the correct insurance total supply', async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance())

        const result = (await insuranceERC20.totalSupply()).toBigInt()

        const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceIncrease

        checkBigIntEquality(result, insuranceTotalSupply)
      })
    })

    describe('fail case', () => {
      beforeEach(async () => {
        await deploy()

        await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

        receiver = accounts[4]

        rateReserve = (await pool.rateReserve()).toBigInt()
        invariance = assetReserve * bondReserve * rateReserve

        calculate()
      })

      it('Should revert if no asset output amount', async () => {
        const wrongAssetReceived = 0n

        await expect(borrow(receiver.address, wrongAssetReceived, bondIncrease, rateIncrease, collateralLocked)).to.be
          .reverted
      })

      it('Should revert if not enough collateral amount', async () => {
        const wrongCollateralLocked = collateralLocked / 1000000000000n

        await expect(borrow(receiver.address, assetReceived, bondIncrease, rateIncrease, wrongCollateralLocked)).to.be
          .reverted
      })

      it('Should revert if pool matured', async () => {
        await advanceTimeAndBlock(duration)
        await expect(borrow(receiver.address, assetReceived, bondIncrease, rateIncrease, collateralLocked)).to.be
          .reverted
      })
    })
  })
})
describe('withdraw', () => {
  const tests = testCases.withdraw
  tests.forEach((test, idx) => {
    const {
      assetReserve,
      bondReserve,
      insuranceReserve,
      collateralReserve,
      bondIn,
      insuranceIn,
      assetReceived,
      collateralReceived,
      bondTotalSupplyBefore,
      insuranceTotalSupplyBefore,
    } = test
    describe(`success case ${idx + 1}`, () => {
      before(async () => {
        await deploy()

        await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

        await advanceTimeAndBlock(duration)

        await pool.connect(receiver).withdraw(receiver.address, bondIn, insuranceIn)
      })

      it('Should have receiver have correct amount of asset', async () => {
        const result = (await testToken1.balanceOf(receiver.address)).toBigInt()
        checkBigIntEquality(result, assetReceived)
      })

      it('Should have receiver have correct amount of collateral', async () => {
        const result = (await testToken2.balanceOf(receiver.address)).toBigInt()

        checkBigIntEquality(result, collateralReceived)
      })

      it('Should have pool have a correct assets', async () => {
        const result = (await testToken1.balanceOf(pool.address)).toBigInt()

        const assetBalance = assetReserve - assetReceived

        checkBigIntEquality(result, assetBalance)
      })

      it('Should have pool have correct collateral', async () => {
        const result = (await testToken2.balanceOf(pool.address)).toBigInt()

        const collateralBalance = collateralReserve - collateralReceived

        checkBigIntEquality(result, collateralBalance)
      })

      it('Should have pool have correct amount of bond tokens', async () => {
        const bondERC20 = await bondAt(await pool.bond())

        const result = (await bondERC20.balanceOf(pool.address)).toBigInt()

        checkBigIntEquality(result, bondReserve)
      })

      it('Should have pool have correct amount of insurance tokens', async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance())

        const result = (await insuranceERC20.balanceOf(pool.address)).toBigInt()

        checkBigIntEquality(result, insuranceReserve)
      })

      it('Should have the correct bond total supply', async () => {
        const bondERC20 = await bondAt(await pool.bond())

        const result = (await bondERC20.totalSupply()).toBigInt()

        const bondTotalSupply = bondTotalSupplyBefore - bondIn

        checkBigIntEquality(result, bondTotalSupply)
      })

      it('Should have the correct insurance total supply', async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance())

        const result = (await insuranceERC20.totalSupply()).toBigInt()

        const insuranceTotalSupply = insuranceTotalSupplyBefore - insuranceIn

        checkBigIntEquality(result, insuranceTotalSupply)
      })
    })

    describe(`fail case ${idx + 1}`, () => {
      beforeEach(async () => {
        await deploy()

        await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)
      })

      it('Should revert if insufficient input amount', async () => {
        const wrongBondIn = 0n
        const wrongInsuranceIn = 0n

        await advanceTimeAndBlock(duration)

        await expect(pool.withdraw(receiver.address, wrongBondIn, wrongInsuranceIn)).to.be.reverted
      })

      it('Should revert if receiver is the pool address', async () => {
        const wrongReceiver = pool.address

        await advanceTimeAndBlock(duration)

        await expect(pool.withdraw(wrongReceiver, bondIn, insuranceIn)).to.be.reverted
      })

      it('Should revert if pool has not matured yet', async () => {
        await expect(pool.withdraw(receiver.address, bondIn, insuranceIn)).to.be.reverted
      })
    })
  })
})

const pay = async (tokenId: bigint, assetIn: bigint) => {
  await testToken1.mint(pool.address, assetIn)
  await pool.connect(receiver).pay(receiver.address, tokenId)
}

describe('pay', () => {
  const tests = testCases.pay
  tests.forEach((test, idx) => {
    const {
      assetReserve,
      bondReserve,
      insuranceReserve,
      collateralReserve,

      tokenId,
      tokenDebt,
      tokenCollateral,
      assetIn,
      collateralReceived,
      assetInExecessive,
      collateralReceivedExecessive,
      assetInFail,
    } = test
    describe(`success case ${idx + 1}`, () => {
      describe('asset deposit is not excessive', () => {
        // const assetIn = 1000n
        // const collateralReceived = 200n

        before(async () => {
          await deploy()

          await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

          await pay(tokenId, assetIn)
        })

        it('Should have receiver have correct amount of collateral', async () => {
          const result = (await testToken2.balanceOf(receiver.address)).toBigInt()

          checkBigIntEquality(result, collateralReceived)
        })

        it('Should have receiver have a correct collateralized debt token', async () => {
          const collateralizedDebtERC721 = await collateralizedDebtAt(await pool.collateralizedDebt())

          const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
          const resultDebt = resultHex.debt.toBigInt()
          const resultCollateral = resultHex.collateral.toBigInt()

          const debtRemaining = tokenDebt - assetIn
          const collateralRemaining = tokenCollateral - collateralReceived

          checkBigIntEquality(resultDebt, debtRemaining)
          checkBigIntEquality(resultCollateral, collateralRemaining)
        })

        it('Should have pool have a correct assets', async () => {
          const result = (await testToken1.balanceOf(pool.address)).toBigInt()
          const resultReserve = (await pool.assetReserve()).toBigInt()

          const assetBalance = assetReserve + assetIn

          checkBigIntEquality(result, assetBalance)
          checkBigIntEquality(resultReserve, assetBalance)
        })

        it('Should have pool have correct collateral', async () => {
          const result = (await testToken2.balanceOf(pool.address)).toBigInt()
          const resultReserve = (await pool.collateralReserve()).toBigInt()

          const collateralBalance = collateralReserve - collateralReceived

          checkBigIntEquality(result, collateralBalance)
          checkBigIntEquality(resultReserve, collateralBalance)
        })
      })

      describe('asset deposit is excessive', () => {
        const assetIn = assetInExecessive
        const collateralReceived = collateralReceivedExecessive

        before(async () => {
          await deploy()

          await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

          await pay(tokenId, assetIn)
        })

        it('Should have receiver have correct amount of collateral', async () => {
          const result = (await testToken2.balanceOf(receiver.address)).toBigInt()

          checkBigIntEquality(result, collateralReceived)
        })

        it('Should have receiver have a correct collateralized debt token', async () => {
          const collateralizedDebtERC721 = await collateralizedDebtAt(await pool.collateralizedDebt())

          const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
          const resultDebt = resultHex.debt.toBigInt()
          const resultCollateral = resultHex.collateral.toBigInt()

          const debtRemaining = 0n
          const collateralRemaining = 0n

          checkBigIntEquality(resultDebt, debtRemaining)
          checkBigIntEquality(resultCollateral, collateralRemaining)
        })

        it('Should have pool have a correct assets', async () => {
          const result = (await testToken1.balanceOf(pool.address)).toBigInt()
          const resultReserve = (await pool.assetReserve()).toBigInt()

          const assetBalance = assetReserve + assetIn

          checkBigIntEquality(result, assetBalance)
          checkBigIntEquality(resultReserve, assetBalance)
        })

        it('Should have pool have correct collateral', async () => {
          const result = (await testToken2.balanceOf(pool.address)).toBigInt()
          const resultReserve = (await pool.collateralReserve()).toBigInt()

          const collateralBalance = collateralReserve - collateralReceived

          checkBigIntEquality(result, collateralBalance)
          checkBigIntEquality(resultReserve, collateralBalance)
        })
      })
    })

    describe(`fail case ${idx + 1}`, () => {
      const assetIn = assetInFail

      beforeEach(async () => {
        await deploy()

        await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)
      })

      it('Should revert if pool already matured', async () => {
        const numberDuration = duration

        await advanceTimeAndBlock(numberDuration)

        await expect(pay(tokenId, assetIn)).to.be.reverted
      })
    })
  })
})

const skim = async (to: string, assetIn: bigint, collateralIn: bigint) => {
  await testToken1.mint(pool.address, assetIn)
  await testToken2.mint(pool.address, collateralIn)

  await pool.skim(to)
}

describe('skim', () => {
  const tests = testCases.skim
  tests.forEach((test, idx) => {
    const { assetReserve, bondReserve, insuranceReserve, collateralReserve, assetSkim, collateralSkim } = test
    describe(`success case ${idx + 1}`, () => {
      before(async () => {
        await deploy()

        await mint(receiver.address, assetReserve, collateralReserve, bondReserve, insuranceReserve)

        await skim(receiver.address, assetSkim, collateralSkim)
      })

      it('Should have receiver a correct amount of asset', async () => {
        const result = (await testToken1.balanceOf(receiver.address)).toBigInt()

        checkBigIntEquality(result, assetSkim)
      })

      it('Should have receiver a correct amount of collateral', async () => {
        const result = (await testToken2.balanceOf(receiver.address)).toBigInt()

        checkBigIntEquality(result, collateralSkim)
      })

      it('Should have pool have a correct assets', async () => {
        const result = (await testToken1.balanceOf(pool.address)).toBigInt()
        const resultReserve = (await pool.assetReserve()).toBigInt()

        checkBigIntEquality(result, assetReserve)
        checkBigIntEquality(resultReserve, assetReserve)
        checkBigIntEquality(result, resultReserve)
      })

      it('Should have pool have correct collateral', async () => {
        const result = (await testToken2.balanceOf(pool.address)).toBigInt()
        const resultReserve = (await pool.collateralReserve()).toBigInt()

        checkBigIntEquality(result, collateralReserve)
        checkBigIntEquality(resultReserve, collateralReserve)
        checkBigIntEquality(result, resultReserve)
      })
    })
  })
})
