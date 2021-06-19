const { expect } = require('chai')
const { web3 } = require('hardhat')
const { advanceTimeAndBlock, now, getTimestamp } = require('./Helper.js')
const { testCases } = require('./test-cases.js')

const TimeswapFactory = artifacts.require('TimeswapFactory')
const TimeswapPool = artifacts.require('TimeswapPool')
const Insurance = artifacts.require('Insurance')
const Bond = artifacts.require('Bond')
const CollateralizedDebt = artifacts.require('CollateralizedDebt')
const TestToken = artifacts.require('TestToken')

const transactionFee = BigInt(30)
const protocolFee = BigInt(30)

const base = BigInt(10000)
const duration = BigInt(86400)
const year = BigInt(31556926)

let accounts
let timeswapFactory
let timeswapPool
let insurance
let bond
let collateralizedDebt

let feeTo
let feeToSetter
let receiver

const decimals1 = 8
const decimals2 = 18

let testToken1
let testToken2

let maturity

let pool

let timestamp

const div = (x, y) => {

  const z = x / y
  return z
}

const divUp = (x, y) => {
  const z = x / y
  // 
  // 
  if (z * y === x) {
    return z
  }
  return z + 1n
}

const checkBigIntEquality = (result, expected) => {
  // 
  expect(String(result)).to.equal(String(expected))
}

const checkBigIntGte = (result, expected) => {
  res = (result >= expected ? true : false)
  expect(res).to.equal(true)
}
const checkBigIntLte = (result, expected) => {
  res = (result <= expected ? true : false)
  expect(res).to.equal(true)
}

const deployTry = async (desiredMaturity) => {
  accounts = await web3.eth.getAccounts()

  timeswapPool = await TimeswapPool.new()
  bond = await Bond.new()
  insurance = await Insurance.new()
  collateralizedDebt = await CollateralizedDebt.new()

  feeTo = accounts[1]
  feeToSetter = accounts[2]

  timeswapFactory = await TimeswapFactory.new(
    feeTo,
    feeToSetter,
    timeswapPool.address,
    bond.address,
    insurance.address,
    collateralizedDebt.address,
    transactionFee,
    protocolFee
  )

  testToken1 = await TestToken.new(decimals1)
  testToken2 = await TestToken.new(decimals2)

  await timeswapFactory.createPool(
    testToken1.address,
    testToken2.address,
    desiredMaturity
  )

  pool = await TimeswapPool.at(
    await timeswapFactory.getPool(
      testToken1.address,
      testToken2.address,
      maturity
    )
  )
}

const deploy = async () => {
  maturity = (await now()) + duration

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
      const result = await pool.maturity()

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
      const result = await pool.assetReserve()
      checkBigIntEquality(result, 0)
    })

    it('Should have a zero collateralReserve', async () => {
      const result = await pool.collateralReserve()

      checkBigIntEquality(result, 0)
    })

    it('Should have a zero rateReserve', async () => {
      const result = await pool.rateReserve()
      checkBigIntEquality(result, 0)
    })

    it('Should have a correct transaction fee', async () => {
      const result = await pool.transactionFee()
      checkBigIntEquality(result, transactionFee)
    })

    it('Should have a correct protocol fee', async () => {
      const result = await pool.protocolFee()
      checkBigIntEquality(result, protocolFee)
    })

    it('Should have a correct decimals', async () => {
      const decimals = await testToken1.decimals()

      const result = await pool.decimals()

      checkBigIntEquality(result, decimals)
    })

    it('Should have the correct symbol', async () => {
      const result = await pool.symbol()

      expect(result).to.equal('LP-TEST-TEST-' + maturity)
    })

    it('Should have the bond contract have the correct symbol', async () => {
      const bondContract = await Bond.at(await pool.bond())

      const result = await bondContract.symbol()

      expect(result).to.equal('BD-TEST-TEST-' + maturity)
    })

    it('Should have the insurance contract have the correct symbol', async () => {
      const insuranceContract = await Insurance.at(await pool.insurance())

      const result = await insuranceContract.symbol()

      expect(result).to.equal('IN-TEST-TEST-' + maturity)
    })

    it('Should have the collateralized debt contract have the correct symbol', async () => {
      const collateralizedDebtContract = await CollateralizedDebt.at(
        await pool.collateralizedDebt()
      )

      const result = await collateralizedDebtContract.symbol()

      expect(result).to.equal('CD-TEST-TEST-' + maturity)
    })
  })

  describe('fail case', () => {
    it('Should revert if incorrect maturity', async () => {
      // 
      // 
      const wrongMaturity = (await now()) - duration

      await expect(deployTry(wrongMaturity)).to.be.reverted
    })
  })
})

const mint = async (
  to,
  assetIn,
  collateralIn,
  bondIncrease,
  insuranceIncrease
) => {
  await testToken1.mint(pool.address, assetIn)
  await testToken2.mint(pool.address, collateralIn)

  const transaction = await pool.mint(to, bondIncrease, insuranceIncrease)

  timestamp = BigInt(await getTimestamp(transaction.receipt.blockHash))
}

describe('mint', () => {
  describe('mint initial', () => {
    tests = testCases.mintInitial
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

          await mint(
            receiver,
            assetIn,
            collateralIn,
            bondIncrease,
            insuranceIncrease
          )
        })

        it('Should have receiver have correct amount of liquidity tokens', async () => {

          const result = await pool.balanceOf(receiver)
          checkBigIntEquality(result, liquidityReceived)
        })

        it('Should have receiver have correct amount of bond tokens', async () => {
          const bondERC20 = await Bond.at(await pool.bond())
          const result = await bondERC20.balanceOf(receiver)

          checkBigIntEquality(result, bondReceived)
        })

        it('Should have receiver have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const result = await insuranceERC20.balanceOf(receiver)

          checkBigIntEquality(result, insuranceReceived)
        })

        it('Should have receiver have a correct collateralized debt token', async () => {
          const collateralizedDebtERC721 = await CollateralizedDebt.at(
            await pool.collateralizedDebt()
          )

          const tokenId = await collateralizedDebtERC721.totalSupply()
          const result = await collateralizedDebtERC721.ownerOf(tokenId)
          const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
            tokenId
          )
          const resultDebt = resultHex.debt
          const resultCollateral = resultHex.collateral

          expect(result).to.equal(receiver)
          checkBigIntEquality(resultDebt, insuranceIncrease)
          checkBigIntEquality(resultCollateral, bondReceived)
        })

        it('Should have pool have a correct assets reserve and balance', async () => {
          const result = await testToken1.balanceOf(pool.address)
          const resultReserve = await pool.assetReserve()
          checkBigIntEquality(result, assetIn)
          checkBigIntEquality(resultReserve, assetIn)
        })

        it('Should have pool have correct collateral reserve and balance', async () => {
          const result = await testToken2.balanceOf(pool.address)
          const resultReserve = await pool.collateralReserve()

          checkBigIntEquality(result, collateralIn)
          checkBigIntEquality(resultReserve, collateralIn)
        })

        it('Should have pool have correct amount of bond tokens', async () => {
          const bondERC20 = await Bond.at(await pool.bond())

          const result = await bondERC20.balanceOf(pool.address)

          checkBigIntEquality(result, bondIncrease)
        })

        it('Should have pool have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const result = await insuranceERC20.balanceOf(pool.address)

          checkBigIntEquality(result, insuranceIncrease)
        })

        it('Should burn 1000 liquidity tokens', async () => {
          const zero = '0x0000000000000000000000000000000000000000'

          const result = await pool.balanceOf(zero)

          checkBigIntEquality(result, liquidityBurn)
        })

        it('Should have factory receive correct amount of liquidity tokens', async () => {
          const result = await pool.balanceOf(feeTo)

          checkBigIntEquality(result, liquidityFeeTo)
        })

        it('Should have a correct rateReserve', async () => {
          const result = await pool.rateReserve()
          const rateReserve =
            div(insuranceIncrease * year, maturity - timestamp)

          checkBigIntEquality(result, rateReserve)
        })

        it('Should have the correct bond total supply', async () => {
          const bondERC20 = await Bond.at(await pool.bond())

          const result = await bondERC20.totalSupply()

          checkBigIntEquality(result, bondTotalSupply)
        })

        it('Should have the correct insurance total supply', async () => {
          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const result = await insuranceERC20.totalSupply()

          checkBigIntEquality(result, insuranceTotalSupply)
        })

        it('Should have the correct liquidity total supply', async () => {
          const result = await pool.totalSupply()

          checkBigIntEquality(result, liquidityTotalSupply)
        })
      })

      describe(`fail case ${idx + 1}`, () => {
        beforeEach(async () => {
          await deploy()
        })

        it('Should revert if no asset input amount', async () => {
          const wrongAssetIn = 0

          await expect(
            mint(
              receiver,
              wrongAssetIn,
              collateralIn,
              bondIncrease,
              insuranceIncrease
            )
          ).to.be.reverted
        })

        it('Should revert if no collateral input amount', async () => {
          const wrongCollateralIn = 0

          receiver = accounts[4]

          await expect(
            mint(
              receiver,
              assetIn,
              wrongCollateralIn,
              bondIncrease,
              insuranceIncrease
            )
          ).to.be.reverted
        })

        it('Should revert if there is no bond output amount', async () => {
          const wrongBondIncrease = 0

          await expect(
            mint(
              receiver,
              assetIn,
              collateralIn,
              wrongBondIncrease,
              insuranceIncrease
            )
          ).to.be.reverted
        })

        it('Should revert if there is no insurance output amount', async () => {
          const wrongInsuranceIncrease = 0

          await expect(
            mint(
              receiver,
              assetIn,
              collateralIn,
              bondIncrease,
              wrongInsuranceIncrease
            )
          ).to.be.reverted
        })

        it('Should revert if pool matured', async () => {
          await advanceTimeAndBlock(duration)

          await expect(
            mint(
              receiver,
              assetIn,
              collateralIn,
              bondIncrease,
              insuranceIncrease
            )
          ).to.be.reverted
        })
      })
    })
  })

  describe('mint proportional', () => {
    let rateReserve
    tests = testCases.mintProportional
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

          await mint(
            receiver,
            assetReserve,
            collateralReserve,
            bondReserve,
            insuranceReserve
          )

          receiver = accounts[4]

          rateReserve = await pool.rateReserve()

          await mint(
            receiver,
            assetIn,
            collateralIn,
            bondIncrease,
            insuranceIncrease
          )
        })

        it('Should have receiver have correct amount of liquidity tokens', async () => {
          const result = await pool.balanceOf(receiver)

          checkBigIntEquality(result, liquidityReceived)
        })

        it('Should have receiver have correct amount of bond tokens', async () => {
          const bondERC20 = await Bond.at(await pool.bond())

          const result = await bondERC20.balanceOf(receiver)

          checkBigIntEquality(result, bondReceived)
        })

        it('Should have receiver have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const result = await insuranceERC20.balanceOf(receiver)


          checkBigIntEquality(result, insuranceReceived)
        })

        it('Should have receiver have a correct collateralized debt token', async () => {
          const collateralizedDebtERC721 = await CollateralizedDebt.at(
            await pool.collateralizedDebt()
          )

          const tokenId = await collateralizedDebtERC721.totalSupply()
          const result = await collateralizedDebtERC721.ownerOf(tokenId)
          const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
            tokenId
          )
          const resultDebt = resultHex.debt
          const resultCollateral = resultHex.collateral

          expect(result).to.equal(receiver)
          checkBigIntEquality(resultDebt, insuranceIncrease)
          checkBigIntEquality(resultCollateral, bondReceived)
        })

        it('Should have pool have a correct assets reserve and balance', async () => {
          const result = await testToken1.balanceOf(pool.address)
          const resultReserve = await pool.assetReserve()

          const assetBalance = assetReserve + assetIn

          checkBigIntEquality(result, assetBalance)
          checkBigIntEquality(resultReserve, assetBalance)
        })

        it('Should have pool have correct collateral reserve and balance', async () => {
          const result = await testToken2.balanceOf(pool.address)
          const resultReserve = await pool.collateralReserve()

          const collateralBalance = collateralReserve + collateralIn

          checkBigIntEquality(result, collateralBalance)
          checkBigIntEquality(resultReserve, collateralBalance)
        })

        it('Should have pool have correct amount of bond tokens', async () => {
          const bondERC20 = await Bond.at(await pool.bond())

          const result = await bondERC20.balanceOf(pool.address)

          const bondBalance = bondReserve + bondIncrease

          checkBigIntEquality(result, bondBalance)
        })

        it('Should have pool have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const result = await insuranceERC20.balanceOf(pool.address)

          const insuranceBalance = insuranceReserve + insuranceIncrease

          checkBigIntEquality(result, insuranceBalance)
        })

        it('Should have factory receive correct amount of liquidity tokens', async () => {
          const result = await pool.balanceOf(feeTo)

          checkBigIntEquality(result, (feeToBalance + liquidityFeeTo))
        })

        it('Should have a correct rateReserve', async () => {
          const result = await pool.rateReserve()
          const rateIncrease = divUp(
            BigInt(rateReserve) * (liquidityReceived + liquidityFeeTo),
            insuranceReserve
          )

          const newRateReserve = BigInt(rateReserve) + BigInt(rateIncrease)

          checkBigIntEquality(result, newRateReserve)
        })

        it('Should have the correct ratio on its asset reserves', async () => {
          const totalSupply = await pool.totalSupply()
          const ratioLiquidity =
            BigInt(totalSupply) / BigInt(liquidityReceived + liquidityFeeTo)



          const resultAsset = await testToken1.balanceOf(pool.address)
          const ratioAsset = BigInt(resultAsset) / BigInt(assetIn)


          checkBigIntGte(ratioLiquidity, ratioAsset)
        })

        it('Should have the correct ratio on its bond reserves', async () => {
          const totalSupply = await pool.totalSupply()
          const ratioLiquidity =
            BigInt(totalSupply) / BigInt(liquidityReceived + liquidityFeeTo)

          const bondERC20 = await Bond.at(await pool.bond())

          const resultBond = await bondERC20.balanceOf(pool.address)
          const ratioBond = BigInt(resultBond) / BigInt(bondIncrease)

          checkBigIntGte(ratioLiquidity, ratioBond)
        })

        it('Should have the correct ratio on its insurance reserves', async () => {
          const totalSupply = await pool.totalSupply()
          const ratioLiquidity =
            BigInt(totalSupply) / BigInt(liquidityReceived + liquidityFeeTo)

          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const resultInsuranceHex = await insuranceERC20.balanceOf(
            pool.address
          )
          const resultInsurance = resultInsuranceHex
          const ratioInsurance = BigInt(resultInsurance) / BigInt(insuranceIncrease)

          checkBigIntGte(ratioLiquidity, ratioInsurance)
        })

        it('Should have the correct bond total supply', async () => {
          const bondERC20 = await Bond.at(await pool.bond())

          const result = await bondERC20.totalSupply()

          const bondTotalSupply =
            bondTotalSupplyBefore + bondIncrease + bondReceived

          checkBigIntEquality(result, bondTotalSupply)
        })

        it('Should have the correct insurance total supply', async () => {
          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const result = await insuranceERC20.totalSupply()

          const insuranceTotalSupply =
            insuranceTotalSupplyBefore + insuranceIncrease + insuranceReceived

          checkBigIntEquality(result, insuranceTotalSupply)
        })

        it('Should have the correct liquidity total supply', async () => {
          const result = await pool.totalSupply()

          const liquidityTotalSupply =
            liquidityTotalSupplyBefore + liquidityReceived + liquidityFeeTo

          checkBigIntEquality(result, liquidityTotalSupply)
        })
      })

      describe(`fail case ${idx + 1}`, () => {
        beforeEach(async () => {
          await deploy()

          await mint(
            receiver,
            assetReserve,
            collateralReserve,
            bondReserve,
            insuranceReserve
          )

          receiver = accounts[4]
        })

        it('Should revert if no asset input amount', async () => {
          const wrongAssetIn = 0n

          await expect(
            mint(
              receiver,
              wrongAssetIn,
              collateralIn,
              bondIncrease,
              insuranceIncrease
            )
          ).to.be.reverted
        })

        it('Should revert if no collateral input amount', async () => {
          const wrongCollateralIn = 0n

          await expect(
            mint(
              receiver,
              assetIn,
              wrongCollateralIn,
              bondIncrease,
              insuranceIncrease
            )
          ).to.be.reverted
        })

        it('Should revert if no bond output amount', async () => {
          const wrongBondIncrease = 0n

          await expect(
            mint(
              receiver,
              assetIn,
              collateralIn,
              wrongBondIncrease,
              insuranceIncrease
            )
          ).to.be.reverted
        })

        it('Should revert if no insurance output amount', async () => {
          const wrongInsuranceIncrease = 0n

          await expect(
            mint(
              receiver,
              assetIn,
              collateralIn,
              bondIncrease,
              wrongInsuranceIncrease
            )
          ).to.be.reverted
        })

        it('Should revert if collateral transferred is not enough', async () => {
          const wrongCollateralIn = collateralIn - 1n

          await expect(
            mint(
              receiver,
              assetIn,
              wrongCollateralIn,
              bondIncrease,
              insuranceIncrease
            )
          ).to.be.reverted
        })

        it('Should revert if pool matured', async () => {
          await advanceTimeAndBlock(duration)

          await expect(
            mint(
              receiver,
              assetIn,
              collateralIn,
              bondIncrease,
              insuranceIncrease
            )
          ).to.be.reverted
        })
      })
    })
  })
})

const burn = async (owner, to, liquidityIn, collateralIn) => {
  await pool.transfer(pool.address, liquidityIn, { from: owner })
  await testToken2.mint(pool.address, collateralIn)

  const transaction = await pool.burn(to)

  timestamp = await getTimestamp(transaction.receipt.blockHash)
}

describe('burn', () => {
  let rateReserve
  describe('burn before maturity', () => {
    tests = testCases.burnBeforeMaturity
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
        assetReceivedExecessive,
        collateralLockedExcessive,
      } = test
      describe(`success case ${idx + 1}`, async () => {
        describe('collateral locked is not excessive', () => {
          before(async () => {
            await deploy()

            await mint(
              receiver,
              assetReserve,
              collateralReserve,
              bondReserve,
              insuranceReserve
            )

            const owner = accounts[3]
            receiver = accounts[4]

            rateReserve = BigInt(await pool.rateReserve())

            await burn(owner, receiver, liquidityIn, collateralIn)
          })

          it('Should have receiver have correct amount of asset', async () => {
            const result = BigInt(await testToken1.balanceOf(receiver))

            checkBigIntEquality(result, assetReceived)
          })

          it('Should have receiver have correct amount of bond tokens', async () => {
            const bondERC20 = await Bond.at(await pool.bond())

            const result = await bondERC20.balanceOf(receiver)

            checkBigIntEquality(result, bondReceived)
          })

          it('Should have receiver have correct amount of insurance tokens', async () => {
            const insuranceERC20 = await Insurance.at(await pool.insurance())

            const result = await insuranceERC20.balanceOf(receiver)
            checkBigIntEquality(result, insuranceReceived)
          })

          it('Should have receiver have a correct collateralized debt token', async () => {
            const collateralizedDebtERC721 = await CollateralizedDebt.at(
              await pool.collateralizedDebt()
            )

            const tokenId = await collateralizedDebtERC721.totalSupply()
            const result = await collateralizedDebtERC721.ownerOf(tokenId)
            const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
              tokenId
            )
            const resultDebt = resultHex.debt
            const resultCollateral =
              resultHex.collateral


            expect(result).to.equal(receiver)
            checkBigIntEquality(resultDebt, assetReceived)
            checkBigIntEquality(resultCollateral, collateralIn)
          })

          it('Should have pool have a correct assets', async () => {
            const result = await testToken1.balanceOf(pool.address)
            const resultReserve = await pool.assetReserve()
            const assetBalance = assetReserve - assetReceived

            checkBigIntEquality(result, assetBalance)
            checkBigIntEquality(resultReserve, assetBalance)
          })

          it('Should have pool have correct collateral', async () => {
            const result = await testToken2.balanceOf(pool.address)
            const resultReserve = await pool.collateralReserve()
            const collateralBalance = collateralReserve + collateralIn

            checkBigIntEquality(result, collateralBalance)
            checkBigIntEquality(resultReserve, collateralBalance)
          })

          it('Should have pool have correct amount of bond tokens', async () => {
            const bondERC20 = await Bond.at(await pool.bond())

            const result = await bondERC20.balanceOf(pool.address)

            const bondBalance = bondReserve - bondReceived

            checkBigIntEquality(result, bondBalance)
          })

          it('Should have pool have correct amount of insurance tokens', async () => {
            const insuranceERC20 = await Insurance.at(await pool.insurance())

            const result = await insuranceERC20.balanceOf(pool.address)

            const insuranceBalance = insuranceReserve - insuranceReceived

            checkBigIntEquality(result, insuranceBalance)
          })

          it('Should have a correct rateReserve', async () => {
            const result = await pool.rateReserve()

            const rateDecrease = div(
              rateReserve * liquidityIn,
              liquidityTotalSupplyBefore
            )

            const newRateReserve = BigInt(rateReserve - rateDecrease)

            checkBigIntEquality(result, newRateReserve)
          })

          it('Should have the correct ratio on its bond reserves', async () => {
            const resultLiquidity = await pool.balanceOf(receiver)
            const ratioLiquidity = BigInt(resultLiquidity) / BigInt(liquidityIn)

            const bondERC20 = await Bond.at(await pool.bond())

            const resultBond = await bondERC20.balanceOf(pool.address)
            const ratioBond = BigInt(resultBond) / BigInt(bondReceived)

            checkBigIntLte(ratioLiquidity, ratioBond)
          })

          it('Should have the correct ratio on its insurance reserves', async () => {
            const resultLiquidity = await pool.balanceOf(receiver)
            const ratioLiquidity = BigInt(resultLiquidity) / BigInt(liquidityIn)

            const insuranceERC20 = await Insurance.at(await pool.insurance())

            const resultInsuranceHex = await insuranceERC20.balanceOf(
              pool.address
            )
            const resultInsurance = resultInsuranceHex
            const ratioInsurance = BigInt(resultInsurance) / BigInt(insuranceReceived)

            checkBigIntLte(ratioLiquidity, ratioInsurance)
          })

          it('Should have the correct bond total supply', async () => {
            const bondERC20 = await Bond.at(await pool.bond())

            const result = await bondERC20.totalSupply()

            checkBigIntEquality(result, bondTotalSupplyBefore)
          })

          it('Should have the correct insurance total supply', async () => {
            const insuranceERC20 = await Insurance.at(await pool.insurance())

            const result = await insuranceERC20.totalSupply()

            checkBigIntEquality(result, insuranceTotalSupplyBefore)
          })

          it('Should have the correct liquidity total supply', async () => {
            const result = await pool.totalSupply()

            const liquidityTotalSupply =
              liquidityTotalSupplyBefore - liquidityIn

            checkBigIntEquality(result, liquidityTotalSupply)
          })
        })

        describe('collateral locked is excessive', () => {
          const collateralIn = collateralInExcessive
          const collateralLocked = collateralLockedExcessive
          const assetReceived = assetReceivedExecessive

          before(async () => {
            await deploy()

            await mint(
              receiver,
              assetReserve,
              collateralReserve,
              bondReserve,
              insuranceReserve
            )

            const owner = accounts[3]
            receiver = accounts[4]

            rateReserve = BigInt(await pool.rateReserve())

            await burn(owner, receiver, liquidityIn, collateralIn)
          })

          it('Should have receiver have correct amount of asset', async () => {
            const result = await testToken1.balanceOf(receiver)

            checkBigIntEquality(result, assetReceived)
          })

          it('Should have receiver have correct amount of bond tokens', async () => {
            const bondERC20 = await Bond.at(await pool.bond())

            const result = await bondERC20.balanceOf(receiver)

            checkBigIntEquality(result, bondReceived)
          })

          it('Should have receiver have correct amount of insurance tokens', async () => {
            const insuranceERC20 = await Insurance.at(await pool.insurance())

            const result = await insuranceERC20.balanceOf(receiver)

            checkBigIntEquality(result, insuranceReceived)
          })

          it('Should have receiver have a correct collateralized debt token', async () => {
            const collateralizedDebtERC721 = await CollateralizedDebt.at(
              await pool.collateralizedDebt()
            )

            const tokenId = await collateralizedDebtERC721.totalSupply()
            const result = await collateralizedDebtERC721.ownerOf(tokenId)
            const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
              tokenId
            )
            const resultDebt = (resultHex.debt)
            const resultCollateral = (
              resultHex.collateral
            )

            expect(result).to.equal(receiver)
            checkBigIntEquality(resultDebt, assetReceived)
            checkBigIntEquality(resultCollateral, collateralLocked)
          })

          it('Should have pool have a correct assets', async () => {
            const result = await testToken1.balanceOf(pool.address)
            const resultReserve = await pool.assetReserve()

            const assetBalance = assetReserve - assetReceived

            checkBigIntEquality(result, assetBalance)
            checkBigIntEquality(resultReserve, assetBalance)
          })

          it('Should have pool have correct collateral', async () => {
            const result = await testToken2.balanceOf(pool.address)
            const resultReserve = await pool.collateralReserve()

            const collateralBalance = collateralReserve + collateralIn

            checkBigIntEquality(result, collateralBalance)
            checkBigIntEquality(resultReserve, collateralBalance)
          })

          it('Should have pool have correct amount of bond tokens', async () => {
            const bondERC20 = await Bond.at(await pool.bond())

            const result = await bondERC20.balanceOf(pool.address)

            const bondBalance = bondReserve - bondReceived

            checkBigIntEquality(result, bondBalance)
          })

          it('Should have pool have correct amount of insurance tokens', async () => {
            const insuranceERC20 = await Insurance.at(await pool.insurance())

            const result = await insuranceERC20.balanceOf(pool.address)

            const insuranceBalance = insuranceReserve - insuranceReceived

            checkBigIntEquality(result, insuranceBalance)
          })

          it('Should have a correct invariance', async () => {
            const result = await pool.rateReserve()

            const rateDecrease = div(
              rateReserve * liquidityIn,
              liquidityTotalSupplyBefore
            )

            const newRateReserve = BigInt(rateReserve - rateDecrease)

            checkBigIntEquality(result, newRateReserve)
          })

          it('Should have the correct ratio on its asset reserve and balance', async () => {
            const resultLiquidity = await pool.balanceOf(receiver)
            const ratioLiquidity = BigInt(resultLiquidity) / BigInt(liquidityIn)

            const resultAsset = await testToken1.balanceOf(pool.address)
            const ratioAsset = BigInt(resultAsset) / BigInt(assetReceived)

            const resultAssetReserveHex = await pool.assetReserve()
            const resultAssetReserve = (
              resultAssetReserveHex
            )
            const ratioAssetReserve = BigInt(resultAssetReserve) / BigInt(assetReceived)

            checkBigIntLte(ratioLiquidity, ratioAsset)
            checkBigIntLte(ratioLiquidity, ratioAssetReserve)
          })

          it('Should have the correct ratio on its bond reserves', async () => {
            const resultLiquidity = await pool.balanceOf(receiver)
            const ratioLiquidity = BigInt(resultLiquidity) / BigInt(liquidityIn)

            const bondERC20 = await Bond.at(await pool.bond())

            const resultBond = await bondERC20.balanceOf(pool.address)
            const ratioBond = BigInt(resultBond) / BigInt(bondReceived)

            checkBigIntLte(ratioLiquidity, ratioBond)
          })

          it('Should have the correct ratio on its insurance reserves', async () => {
            const resultLiquidity = await pool.balanceOf(receiver)
            const ratioLiquidity = BigInt(resultLiquidity) / BigInt(liquidityIn)

            const insuranceERC20 = await Insurance.at(await pool.insurance())

            const resultInsuranceHex = await insuranceERC20.balanceOf(
              pool.address
            )
            const resultInsurance = resultInsuranceHex
            const ratioInsurance = BigInt(resultInsurance) / BigInt(insuranceReceived)

            checkBigIntLte(ratioLiquidity, ratioInsurance)
          })

          it('Should have the correct bond total supply', async () => {
            const bondERC20 = await Bond.at(await pool.bond())

            const result = await bondERC20.totalSupply()

            checkBigIntEquality(result, bondTotalSupplyBefore)
          })

          it('Should have the correct insurance total supply', async () => {
            const insuranceERC20 = await Insurance.at(await pool.insurance())

            const result = await insuranceERC20.totalSupply()

            checkBigIntEquality(result, insuranceTotalSupplyBefore)
          })

          it('Should have the correct liquidity total supply', async () => {
            const result = await pool.totalSupply()

            const liquidityTotalSupply =
              liquidityTotalSupplyBefore - liquidityIn

            checkBigIntEquality(result, liquidityTotalSupply)
          })
        })
      })

      describe(`fail case ${idx + 1}`, async () => {
        beforeEach(async () => {
          await deploy()

          await mint(
            receiver,
            assetReserve,
            collateralReserve,
            bondReserve,
            insuranceReserve
          )

          rateReserve = await pool.rateReserve()
        })

        it('Should revert if insufficient input amount', async () => {
          await expect(burn(receiver, receiver, 0, 0)).to.be.reverted
        })
      })
    })
  })

  describe('burn after maturity', () => {
    tests = testCases.burnAfterMaturity
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

          await mint(
            receiver,
            assetReserve,
            collateralReserve,
            bondReserve,
            insuranceReserve
          )

          const owner = accounts[3]
          receiver = accounts[4]

          await advanceTimeAndBlock(duration)

          await burn(owner, receiver, liquidityIn, 0)
        })

        it('Should have receiver have correct amount of asset', async () => {
          const result = await testToken1.balanceOf(receiver)

          checkBigIntEquality(result, 0)
        })

        it('Should have receiver have correct amount of bond tokens', async () => {
          const bondERC20 = await Bond.at(await pool.bond())

          const result = await bondERC20.balanceOf(receiver)

          checkBigIntEquality(result, bondReceived)
        })

        it('Should have receiver have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const result = await insuranceERC20.balanceOf(receiver)

          checkBigIntEquality(result, insuranceReceived)
        })

        it('Should have pool have a correct assets', async () => {
          const result = await testToken1.balanceOf(pool.address)
          const resultReserve = await pool.assetReserve()

          checkBigIntEquality(result, assetReserve)
          checkBigIntEquality(resultReserve, assetReserve)
        })

        it('Should have pool have correct collateral', async () => {
          const result = await testToken2.balanceOf(pool.address)
          const resultReserve = await pool.collateralReserve()

          checkBigIntEquality(result, collateralReserve)
          checkBigIntEquality(resultReserve, collateralReserve)
        })

        it('Should have pool have correct amount of bond tokens', async () => {
          const bondERC20 = await Bond.at(await pool.bond())

          const result = await bondERC20.balanceOf(pool.address)

          const bondBalance = bondReserve - bondReceived

          checkBigIntEquality(result, bondBalance)
        })

        it('Should have pool have correct amount of insurance tokens', async () => {
          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const result = await insuranceERC20.balanceOf(pool.address)

          const insuranceBalance = insuranceReserve - insuranceReceived

          checkBigIntEquality(result, insuranceBalance)
        })

        it('Should have the correct ratio on its bond reserves', async () => {
          const resultLiquidityHex = await pool.balanceOf(receiver)
          const resultLiquidity = resultLiquidityHex
          const ratioLiquidity = BigInt(resultLiquidity) / BigInt(liquidityIn)

          const bondERC20 = await Bond.at(await pool.bond())

          const resultBondHex = await bondERC20.balanceOf(pool.address)
          const resultBond = resultBondHex
          const ratioBond = BigInt(resultBond) / (bondReceived)

          checkBigIntLte(ratioLiquidity, ratioBond)
        })

        it('Should have the correct ratio on its insurance reserves', async () => {
          const resultLiquidity = await pool.balanceOf(receiver)
          const ratioLiquidity = BigInt(resultLiquidity) / BigInt(liquidityIn)

          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const resultInsuranceHex = await insuranceERC20.balanceOf(
            pool.address
          )
          const resultInsurance = resultInsuranceHex
          const ratioInsurance = BigInt(resultInsurance) / BigInt(insuranceReceived)

          checkBigIntLte(ratioLiquidity, ratioInsurance)
        })

        it('Should have the correct bond total supply', async () => {
          const bondERC20 = await Bond.at(await pool.bond())

          const result = await bondERC20.totalSupply()

          checkBigIntEquality(result, bondTotalSupplyBefore)
        })

        it('Should have the correct insurance total supply', async () => {
          const insuranceERC20 = await Insurance.at(await pool.insurance())

          const result = await insuranceERC20.totalSupply()

          checkBigIntEquality(result, insuranceTotalSupplyBefore)
        })

        it('Should have the correct liquidity total supply', async () => {
          const result = await pool.totalSupply()

          const liquidityTotalSupply = liquidityTotalSupplyBefore - liquidityIn

          checkBigIntEquality(result, liquidityTotalSupply)
        })
      })

      describe(`fail case ${idx + 1}`, async () => {
        beforeEach(async () => {
          await deploy()

          await mint(
            receiver,
            assetReserve,
            collateralReserve,
            bondReserve,
            insuranceReserve
          )

          rateReserve = await pool.rateReserve()

          await advanceTimeAndBlock(duration)
        })

        it('Should revert if insufficient input amount', async () => {
          await expect(burn(receiver, receiver, 0, 0)).to.be.reverted
        })
      })
    })
  })
})
const lend = async (to, assetIn, bondDecrease, rateDecrease) => {
  await testToken1.mint(pool.address, assetIn)

  // 
  // 
  // 

  const transaction = await pool.lend(to, bondDecrease, rateDecrease)

  timestamp = BigInt(await getTimestamp(transaction.receipt.blockHash))
}

describe('lend', () => {
  let tests = testCases.lend

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

    let rateDecrease

    let bondMint

    let insuranceDecrease
    let insuranceMint

    let invariance

    const calculate = () => {
      const bondDecreaseAdjusted =
        bondReserve * base - bondDecrease * (base + transactionFee)
      const rateDecreaseAdjusted = divUp(
        divUp(BigInt(invariance) * base * base, assetReserve + assetIn),
        bondDecreaseAdjusted
      )
      rateDecrease = div(
        rateReserve * base - rateDecreaseAdjusted,
        base + transactionFee
      )

      bondMint = div(
        div(bondDecrease * rateReserve, assetReserve) * (BigInt(maturity) - timestamp),
        year
      )

      insuranceDecrease = div(BigInt(rateDecrease) * (BigInt(maturity) - timestamp), year)
      insuranceMint = div(BigInt(rateDecrease) * (assetReserve + assetIn), BigInt(rateReserve))
    }

    describe(`success case ${idx + 1}`, () => {
      before(async () => {
        await deploy()

        await mint(
          receiver,
          assetReserve,
          collateralReserve,
          bondReserve,
          insuranceReserve
        )

        receiver = accounts[4]
        // 
        rateReserve = BigInt(await pool.rateReserve())
        // 

        invariance = rateReserve * BigInt(assetReserve) * BigInt(bondReserve)
        calculate()

        await lend(receiver, assetIn, bondDecrease, rateDecrease)
      })

      it('Should have receiver have correct amount of bond tokens', async () => {
        const bondERC20 = await Bond.at(await pool.bond())

        const result = await bondERC20.balanceOf(receiver)

        const bondReceived = bondDecrease + bondMint
        checkBigIntEquality(result, bondReceived)
      })

      it('Should have receiver have correct amount of insurance tokens', async () => {
        const insuranceERC20 = await Insurance.at(await pool.insurance())
        const result = await insuranceERC20.balanceOf(receiver)

        const insuranceReceived = insuranceDecrease + insuranceMint

        checkBigIntEquality(result, insuranceReceived)
      })

      it('Should have pool have a correct assets reserve and balance', async () => {
        const result = await testToken1.balanceOf(pool.address)

        const resultReserve = await pool.assetReserve()

        const assetBalance = assetReserve + assetIn

        checkBigIntEquality(result, assetBalance)
        checkBigIntEquality(resultReserve, assetBalance)
      })

      it('Should have pool have correct collateral reserve and balance', async () => {
        const result = await testToken2.balanceOf(pool.address)
        const resultReserve = await pool.collateralReserve()

        checkBigIntEquality(result, collateralReserve)
        checkBigIntEquality(resultReserve, collateralReserve)
      })

      it('Should have pool have correct amount of bond tokens', async () => {
        const bondERC20 = await Bond.at(await pool.bond())

        const result = await bondERC20.balanceOf(pool.address)

        const bondBalance = bondReserve - bondDecrease

        checkBigIntEquality(result, bondBalance)
      })

      it('Should have pool have correct amount of insurance tokens', async () => {
        const insuranceERC20 = await Insurance.at(await pool.insurance())

        const result = await insuranceERC20.balanceOf(pool.address)

        const insuranceBalance = insuranceReserve - insuranceDecrease

        checkBigIntEquality(result, insuranceBalance)
      })

      it('Should have the correct bond total supply', async () => {
        const bondERC20 = await Bond.at(await pool.bond())

        const result = await bondERC20.totalSupply()
        const bondTotalSupply = bondTotalSupplyBefore + bondMint

        checkBigIntEquality(result, bondTotalSupply)
      })

      it('Should have the correct insurance total supply', async () => {
        const insuranceERC20 = await Insurance.at(await pool.insurance())

        const result = await insuranceERC20.totalSupply()

        const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceMint

        checkBigIntEquality(result, insuranceTotalSupply)
      })
    })

    describe(`fail case ${idx + 1}`, () => {
      beforeEach(async () => {
        await deploy()

        await mint(
          receiver,
          assetReserve,
          collateralReserve,
          bondReserve,
          insuranceReserve
        )

        receiver = accounts[4]

        invariance = await pool.invariance()

        rateReserve = await pool.rateReserve()

        calculate()
      })

      it('Should revert if no asset input amount', async () => {
        const wrongAssetIn = 0n

        await expect(lend(receiver, wrongAssetIn, bondDecrease, rateDecrease))
          .to.be.reverted
      })

      it('Should revert if pool matured', async () => {
        await advanceTimeAndBlock(duration)

        await expect(lend(receiver, assetIn, bondDecrease, rateDecrease)).to.be
          .reverted
      })
    })
  })
})

const borrow = async (
  to,
  assetReceived,
  bondIncrease,
  rateIncrease,
  collateralIn
) => {
  await testToken2.mint(pool.address, collateralIn)

  const transaction = await pool.borrow(
    to,
    assetReceived,
    bondIncrease,
    rateIncrease
  )

  timestamp = await getTimestamp(transaction.receipt.blockHash)
}

describe('borrow', () => {
  let tests = testCases.borrow

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

    let rateReserve

    let rateIncrease

    let collateralLocked

    let insuranceIncrease
    let debtRequired

    let invariance

    const calculate = () => {
      const bondIncreaseAdjusted =
        bondReserve * base + bondIncrease * (base - transactionFee)
      const rateIncreaseAdjusted = divUp(
        divUp(BigInt(invariance) * base * base, assetReserve - assetReceived),
        bondIncreaseAdjusted
      )
      rateIncrease = divUp(
        rateIncreaseAdjusted - rateReserve * base,
        base - transactionFee
      )

      const bondMax = div(
        assetReceived * bondReserve,
        assetReserve - assetReceived
      )
      const bondMaxUp = divUp(
        assetReceived * bondReserve,
        assetReserve - assetReceived
      )

      collateralLocked = divUp(BigInt(bondMaxUp) * BigInt(bondIncrease), BigInt(bondMax) - BigInt(bondIncrease))
      collateralLocked = divUp(BigInt(collateralLocked) * BigInt(rateReserve), BigInt(assetReserve))
      collateralLocked = divUp(BigInt(collateralLocked) * BigInt(maturity - timestamp), BigInt(year))
      collateralLocked += BigInt(bondMaxUp)

      insuranceIncrease = divUp(BigInt(rateIncrease) * (BigInt(maturity) - BigInt(timestamp)), BigInt(year))

      const rateMax = div(
        BigInt(assetReceived) * BigInt(rateReserve),
        BigInt(assetReserve) - BigInt(assetReceived)
      )
      const rateMaxUp = divUp(
        BigInt(assetReceived) * BigInt(rateReserve),
        BigInt(assetReserve) - BigInt(assetReceived)
      )
      debtRequired = divUp(BigInt(rateMaxUp * rateIncrease), BigInt(rateMax - rateIncrease))
      debtRequired = divUp(BigInt(debtRequired) * BigInt(maturity - timestamp), year)
      debtRequired = debtRequired + BigInt(assetReceived)
    }
    describe(`success case ${idx + 1}`, () => {
      before(async () => {
        await deploy()

        await mint(
          receiver,
          assetReserve,
          collateralReserve,
          bondReserve,
          insuranceReserve
        )

        receiver = accounts[4]

        invariance = BigInt(await pool.invariance())

        rateReserve = div(div(invariance, assetReserve), bondReserve)

        calculate()

        await borrow(
          receiver,
          assetReceived,
          bondIncrease,
          rateIncrease,
          collateralLocked
        )
      })

      it('Should have receiver have correct amount of asset', async () => {
        const result = await testToken1.balanceOf(receiver)

        checkBigIntEquality(result, assetReceived)
      })

      it('Should have receiver have a correct collateralized debt token', async () => {
        const collateralizedDebtERC721 = await CollateralizedDebt.at(
          await pool.collateralizedDebt()
        )
        const tokenId = await collateralizedDebtERC721.totalSupply()
        const result = await collateralizedDebtERC721.ownerOf(tokenId)
        const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
          tokenId
        )
        const resultDebt = (resultHex.debt)
        const resultCollateral = (resultHex.collateral)

        expect(result).to.equal(receiver)
        checkBigIntLte(resultDebt, debtRequired)
        checkBigIntLte(resultCollateral, collateralLocked)
      })

      it('Should have pool have a correct assets', async () => {
        const result = await testToken1.balanceOf(pool.address)
        const resultReserve = await pool.assetReserve()

        const assetBalance = assetReserve - assetReceived

        checkBigIntEquality(result, assetBalance)
        checkBigIntEquality(resultReserve, assetBalance)
      })

      it('Should have pool have correct collateral', async () => {
        const result = await testToken2.balanceOf(pool.address)
        const resultReserve = await pool.collateralReserve()
        const collateralBalance = collateralReserve + collateralLocked

        checkBigIntEquality(result, collateralBalance)
        checkBigIntEquality(resultReserve, collateralBalance)
      })

      it('Should have pool have correct amount of bond tokens', async () => {
        const bondERC20 = await Bond.at(await pool.bond())

        const result = await bondERC20.balanceOf(pool.address)

        const bondBalance = bondReserve + bondIncrease

        checkBigIntEquality(result, bondBalance)
      })

      it('Should have pool have correct amount of insurance tokens', async () => {
        const insuranceERC20 = await Insurance.at(await pool.insurance())

        const result = await insuranceERC20.balanceOf(pool.address)

        const insuranceBalance = insuranceReserve + insuranceIncrease

        checkBigIntEquality(result, insuranceBalance)
      })

      it('Should have the correct bond total supply', async () => {
        const bondERC20 = await Bond.at(await pool.bond())

        const result = await bondERC20.totalSupply()
        const bondTotalSupply = bondTotalSupplyBefore + bondIncrease

        checkBigIntEquality(result, bondTotalSupply)
      })

      it('Should have the correct insurance total supply', async () => {
        const insuranceERC20 = await Insurance.at(await pool.insurance())

        const result = await insuranceERC20.totalSupply()

        const insuranceTotalSupply =
          insuranceTotalSupplyBefore + insuranceIncrease

        checkBigIntEquality(result, insuranceTotalSupply)
      })
    })

    describe("fail case", () => {
      beforeEach(async () => {
        await deploy()

        await mint(receiver, assetReserve, collateralReserve, bondReserve, insuranceReserve)

        receiver = accounts[4]

        invariance = await pool.invariance()
        // 
        rateReserve = div(div(BigInt(invariance), BigInt(assetReserve)), BigInt(bondReserve))

        calculate()
      })

      it('Should revert if no asset output amount', async () => {
        const wrongAssetReceived = 0n

        await expect(borrow(receiver, wrongAssetReceived, bondIncrease, rateIncrease, collateralLocked)).to.be.reverted
      })

      it("Should revert if not enough collateral amount", async () => {
        const wrongCollateralLocked = collateralLocked - 2n

        await expect(borrow(receiver, assetReceived, bondIncrease, rateIncrease, wrongCollateralLocked)).to.be.reverted
      })

      it("Should revert if pool matured", async () => {
        await advanceTimeAndBlock(duration)

        await expect(borrow(receiver, assetReceived, bondIncrease, rateIncrease, collateralLocked)).to.be.reverted
      })
    })
  })
})
describe('withdraw', () => {
  let tests = testCases.withdraw

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

        await mint(
          receiver,
          assetReserve,
          collateralReserve,
          bondReserve,
          insuranceReserve
        )

        await advanceTimeAndBlock(duration)

        await pool.withdraw(receiver, bondIn, insuranceIn, { from: receiver })
      })

      it('Should have receiver have correct amount of asset', async () => {
        const result = await testToken1.balanceOf(receiver)
        checkBigIntEquality(result, assetReceived)
      })

      it('Should have receiver have correct amount of collateral', async () => {
        const result = await testToken2.balanceOf(receiver)

        checkBigIntEquality(result, collateralReceived)
      })

      it('Should have pool have a correct assets', async () => {
        const result = await testToken1.balanceOf(pool.address)

        const assetBalance = assetReserve - assetReceived

        checkBigIntEquality(result, assetBalance)
      })

      it('Should have pool have correct collateral', async () => {
        const result = await testToken2.balanceOf(pool.address)

        const collateralBalance = collateralReserve - collateralReceived

        checkBigIntEquality(result, collateralBalance)
      })

      it('Should have pool have correct amount of bond tokens', async () => {
        const bondERC20 = await Bond.at(await pool.bond())

        const result = await bondERC20.balanceOf(pool.address)

        checkBigIntEquality(result, bondReserve)
      })

      it('Should have pool have correct amount of insurance tokens', async () => {
        const insuranceERC20 = await Insurance.at(await pool.insurance())

        const result = await insuranceERC20.balanceOf(pool.address)

        checkBigIntEquality(result, insuranceReserve)
      })

      it('Should have the correct bond total supply', async () => {
        const bondERC20 = await Bond.at(await pool.bond())

        const result = await bondERC20.totalSupply()

        const bondTotalSupply = bondTotalSupplyBefore - bondIn

        checkBigIntEquality(result, bondTotalSupply)
      })

      it('Should have the correct insurance total supply', async () => {
        const insuranceERC20 = await Insurance.at(await pool.insurance())

        const result = await insuranceERC20.totalSupply()

        const insuranceTotalSupply = insuranceTotalSupplyBefore - insuranceIn

        checkBigIntEquality(result, insuranceTotalSupply)
      })
    })

    describe(`fail case ${idx + 1}`, () => {
      beforeEach(async () => {
        await deploy()

        await mint(
          receiver,
          assetReserve,
          collateralReserve,
          bondReserve,
          insuranceReserve
        )
      })

      it('Should revert if insufficient input amount', async () => {
        const wrongBondIn = 0n
        const wrongInsuranceIn = 0n

        await advanceTimeAndBlock(duration)

        await expect(pool.withdraw(receiver, wrongBondIn, wrongInsuranceIn)).to
          .be.reverted
      })

      it('Should revert if receiver is the pool address', async () => {
        const wrongReceiver = pool.address

        await advanceTimeAndBlock(duration)

        await expect(pool.withdraw(wrongReceiver, bondIn, insuranceIn)).to.be
          .reverted
      })

      it('Should revert if pool has not matured yet', async () => {
        await expect(pool.withdraw(receiver, bondIn, insuranceIn)).to.be
          .reverted
      })
    })
  })
})

const pay = async (tokenId, assetIn) => {
  await testToken1.mint(pool.address, assetIn)

  await pool.pay(tokenId)
}

describe('pay', () => {
  tests = testCases.pay

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

          await mint(
            receiver,
            assetReserve,
            collateralReserve,
            bondReserve,
            insuranceReserve
          )

          await pay(tokenId, assetIn)
        })

        it('Should have receiver have correct amount of collateral', async () => {
          const result = await testToken2.balanceOf(receiver)

          checkBigIntEquality(result, collateralReceived)
        })

        it('Should have receiver have a correct collateralized debt token', async () => {
          const collateralizedDebtERC721 = await CollateralizedDebt.at(
            await pool.collateralizedDebt()
          )

          const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
            tokenId
          )
          const resultDebt = resultHex.debt
          const resultCollateral = resultHex.collateral

          const debtRemaining = tokenDebt - assetIn
          const collateralRemaining = tokenCollateral - collateralReceived

          checkBigIntEquality(resultDebt, debtRemaining)
          checkBigIntEquality(resultCollateral, collateralRemaining)
        })

        it('Should have pool have a correct assets', async () => {
          const result = await testToken1.balanceOf(pool.address)
          const resultReserve = await pool.assetReserve()

          const assetBalance = assetReserve + assetIn

          checkBigIntEquality(result, assetBalance)
          checkBigIntEquality(resultReserve, assetBalance)
        })

        it('Should have pool have correct collateral', async () => {
          const result = await testToken2.balanceOf(pool.address)
          const resultReserve = await pool.collateralReserve()

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

          await mint(
            receiver,
            assetReserve,
            collateralReserve,
            bondReserve,
            insuranceReserve
          )

          await pay(tokenId, assetIn)
        })

        it('Should have receiver have correct amount of collateral', async () => {
          const result = await testToken2.balanceOf(receiver)

          checkBigIntEquality(result, collateralReceived)
        })

        it('Should have receiver have a correct collateralized debt token', async () => {
          const collateralizedDebtERC721 = await CollateralizedDebt.at(
            await pool.collateralizedDebt()
          )

          const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
            tokenId
          )
          const resultDebt = resultHex.debt
          const resultCollateral = resultHex.collateral

          const debtRemaining = 0
          const collateralRemaining = 0

          checkBigIntEquality(resultDebt, debtRemaining)
          checkBigIntEquality(resultCollateral, collateralRemaining)
        })

        it('Should have pool have a correct assets', async () => {
          const result = await testToken1.balanceOf(pool.address)
          const resultReserve = await pool.assetReserve()

          const assetBalance = assetReserve + assetIn

          checkBigIntEquality(result, assetBalance)
          checkBigIntEquality(resultReserve, assetBalance)
        })

        it('Should have pool have correct collateral', async () => {
          const result = await testToken2.balanceOf(pool.address)
          const resultReserve = await pool.collateralReserve()

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

        await mint(
          receiver,
          assetReserve,
          collateralReserve,
          bondReserve,
          insuranceReserve
        )
      })

      it('Should revert if there is no asset input', async () => {
        const wrongAssetIn = 0n

        await expect(pay(tokenId, wrongAssetIn)).to.be.reverted
      })

      it('Should revert if debt is already paid fully', async () => {
        const wrongAssetIn = 1n

        await pay(tokenId, assetIn)

        await expect(pay(tokenId, wrongAssetIn)).to.be.reverted
      })

      it('Should revert if pool already matured', async () => {
        numberDuration = duration
        // 
        await advanceTimeAndBlock(numberDuration)

        await expect(pay(tokenId, assetIn)).to.be.reverted
      })
    })
  })
})

const skim = async (to, assetIn, collateralIn) => {
  await testToken1.mint(pool.address, assetIn)
  await testToken2.mint(pool.address, collateralIn)

  await pool.skim(to)
}

describe('skim', () => {
  tests = testCases.skim
  tests.forEach((test, idx) => {
    const {
      assetReserve,
      bondReserve,
      insuranceReserve,
      collateralReserve,
      assetSkim,
      collateralSkim,
    } = test
    describe(`success case ${idx + 1}`, () => {
      before(async () => {
        await deploy()

        await mint(
          receiver,
          assetReserve,
          collateralReserve,
          bondReserve,
          insuranceReserve
        )

        await skim(receiver, assetSkim, collateralSkim)
      })

      it('Should have receiver a correct amount of asset', async () => {
        const result = await testToken1.balanceOf(receiver)


        checkBigIntEquality(result, assetSkim)
      })

      it('Should have receiver a correct amount of collateral', async () => {
        const result = await testToken2.balanceOf(receiver)

        checkBigIntEquality(result, collateralSkim)
      })

      it('Should have pool have a correct assets', async () => {
        const result = await testToken1.balanceOf(pool.address)
        const resultReserve = await pool.assetReserve()
        checkBigIntEquality(result, assetReserve)
        checkBigIntEquality(resultReserve, assetReserve)
        checkBigIntEquality(result, resultReserve)
      })

      it('Should have pool have correct collateral', async () => {
        const result = await testToken2.balanceOf(pool.address)
        const resultReserve = await pool.collateralReserve()

        checkBigIntEquality(result, collateralReserve)
        checkBigIntEquality(resultReserve, collateralReserve)
        checkBigIntEquality(result, resultReserve)
      })
    })
  })
})

