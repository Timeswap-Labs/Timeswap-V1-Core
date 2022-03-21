import { BigNumberish } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { TimeswapMathTest, IPair } from '../../typechain/TimeswapMathTest'
import MintMath from '../libraries/MintMath'
import BorrowMath from '../libraries/BorrowMath'
import BurnMath from '../libraries/BurnMath'
import WithdrawMath from '../libraries/WithdrawMath'
import { expect } from '../shared/Expect'
import { now } from '../shared/Helper'
import { State } from '../shared/PairInterface'
import LendMath from '../libraries/LendMath'

const { solidity } = waffle
chai.use(solidity)

interface Token {
  asset: bigint
  collateral: bigint
}

interface Claims {
  bondPrincipal: bigint
  bondInterest: bigint
  insurancePrincipal: bigint
  insuranceInterest: bigint
}

interface StateParams {
  reserves: Token
  totalLiquidity: bigint
  totalClaims: Claims
  totalDebtCreated: bigint
  x: bigint
  y: bigint
  z: bigint
}

interface StateTestParams {
  reserves: Token
  totalLiquidity: bigint
  totalClaims: Claims
  totalDebtCreated: bigint
  asset: bigint
  interest: bigint
  cdp: bigint
}

let state: IPair.StateStruct = {
  reserves: { asset: 0n, collateral: 0n },
  feeStored: 1n,
  totalLiquidity: 0n,
  totalClaims: { bondPrincipal: 0n, bondInterest: 0n, insuranceInterest: 0n, insurancePrincipal: 0n },
  totalDebtCreated: 0n,
  x: 100n,
  y: 10n,
  z: 1n,
}

let stateTest: State = {
  reserves: { asset: 0n, collateral: 0n },
  totalLiquidity: 0n,
  totalClaims: { bondPrincipal: 0n, bondInterest: 0n, insuranceInterest: 0n, insurancePrincipal: 0n },
  totalDebtCreated: 0n,
  asset: 100n,
  interest: 10n,
  cdp: 1n,
  feeStored: 1n,
}

let maturity: BigNumberish
let assetIn: bigint = 1000n
let interestIncrease: bigint = 30n
let cdpIncrease: bigint = 2n
let signers: SignerWithAddress[]

describe('TimeswapMath', () => {
  let TimeswapMathTestContract: TimeswapMathTest

  describe('Mint Math', () => {
    let liquidityOut: any
    let feeStoredIncrease: any
    let dueOut: any

    describe('New Liquidity', () => {
      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        ;[liquidityOut, dueOut, feeStoredIncrease] = await TimeswapMathTestContract.mint(
          maturity,
          state,
          assetIn,
          interestIncrease,
          cdpIncrease
        )
      })

      it('LiquidityTotal, newLiquidity', async () => {
        const liquidityOutComputed = MintMath.getLiquidity1(assetIn)
        expect(liquidityOut.eq(liquidityOutComputed)).to.be.true
      })

      it('Debt, newLiquidity', async () => {
        const debtComputed = MintMath.getDebt(maturity as bigint, assetIn, interestIncrease, await now())
        expect(dueOut[0].eq(debtComputed)).to.true
      })

      it('Collateral, newLiquidity', async () => {
        const collateralComputed = MintMath.getCollateral(
          maturity as bigint,
          assetIn,
          interestIncrease,
          cdpIncrease,
          await now()
        )
        expect(dueOut[1].eq(collateralComputed)).to.true
      })

      it('StartBlock, newLiquidity', async () => {
        const startBlockComputed = await ethers.provider.getBlockNumber()
        expect(dueOut[2]).to.equal(startBlockComputed)
      })

      it('Fee Stored, newLiquidity', async () => {
        const liquidityOutComputed = MintMath.getLiquidity1(assetIn)

        const feeStoredComputed = MintMath.getFee(stateTest, liquidityOutComputed as bigint)
        expect(feeStoredIncrease.eq(feeStoredComputed)).to.true
      })
    })

    describe('Additional Liquidity', () => {
      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        state.totalLiquidity = 50n
        stateTest.totalLiquidity = 50n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        ;[liquidityOut, dueOut, feeStoredIncrease] = await TimeswapMathTestContract.mint(
          maturity,
          state,
          assetIn,
          interestIncrease,
          cdpIncrease
        )
      })

      it('LiquidityTotal, additional liquidity', async () => {
        const liquidityOutComputed = MintMath.getLiquidity2(stateTest, assetIn, interestIncrease, cdpIncrease)
        expect(liquidityOut.eq(liquidityOutComputed)).to.be.true
      })

      it('Debt, additional liquidity', async () => {
        const debtComputed = MintMath.getDebt(maturity as bigint, assetIn, interestIncrease, await now())
        expect(dueOut[0].eq(debtComputed)).to.true
      })

      it('Collateral, additional liquidity', async () => {
        const collateralComputed = MintMath.getCollateral(
          maturity as bigint,
          assetIn,
          interestIncrease,
          cdpIncrease,
          await now()
        )
        expect(dueOut[1].eq(collateralComputed)).to.true
      })

      it('StartBlock, additional liquidity', async () => {
        const startBlockComputed = await ethers.provider.getBlockNumber()
        expect(dueOut[2]).to.equal(startBlockComputed)
      })

      it('Fee Stored, additional liquidity', async () => {
        const liquidityOutComputed = MintMath.getLiquidity2(stateTest, assetIn, interestIncrease, cdpIncrease)

        const feeStoredComputed = MintMath.getFee(stateTest, liquidityOutComputed as bigint)
        expect(feeStoredIncrease.eq(feeStoredComputed)).to.true
      })
    })
  })

  describe('Burn Math', () => {
    let assetOut: BigNumberish
    let collateralOut: BigNumberish
    let feeOut: BigNumberish
    let liquidityIn = 10n

    describe('totalAssets > totalBond', () => {
      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        state = {
          reserves: { asset: 100n, collateral: 100n },
          feeStored: 1n,
          totalLiquidity: 100n,
          totalClaims: { bondPrincipal: 10n, bondInterest: 10n, insuranceInterest: 10n, insurancePrincipal: 10n },
          totalDebtCreated: 100n,
          x: 100n,
          y: 10n,
          z: 1n,
        }
        stateTest = {
          reserves: { asset: 100n, collateral: 100n },
          totalLiquidity: 100n,
          totalClaims: { bondPrincipal: 10n, bondInterest: 10n, insuranceInterest: 10n, insurancePrincipal: 10n },
          totalDebtCreated: 100n,
          asset: 100n,
          interest: 10n,
          cdp: 1n,
          feeStored: 1n,
        }
        ;[assetOut, collateralOut, feeOut] = await TimeswapMathTestContract.burn(state, liquidityIn)
      })
      it('AssetOut', () => {
        const assetOutComputed = BurnMath.getAsset(stateTest, liquidityIn)
        expect(assetOut == assetOutComputed).to.true
      })
      it('CollateralOut', () => {
        const collateralOutComputed = BurnMath.getCollateral(stateTest, liquidityIn)
        expect(collateralOut == collateralOutComputed).to.true
      })
      it('FeeOut', () => {
        const feeOutComputed = BurnMath.getFee(stateTest, liquidityIn)
        expect(feeOut == feeOutComputed).to.true
      })
    })

    describe('totalAsset == totalBond', () => {
      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        state = {
          reserves: { asset: 100n, collateral: 100n },
          feeStored: 1n,
          totalLiquidity: 100n,
          totalClaims: { bondPrincipal: 50n, bondInterest: 50n, insuranceInterest: 10n, insurancePrincipal: 10n },
          totalDebtCreated: 100n,
          x: 100n,
          y: 10n,
          z: 1n,
        }
        stateTest = {
          reserves: { asset: 100n, collateral: 100n },
          totalLiquidity: 100n,
          totalClaims: { bondPrincipal: 50n, bondInterest: 50n, insuranceInterest: 10n, insurancePrincipal: 10n },
          totalDebtCreated: 100n,
          asset: 100n,
          interest: 10n,
          cdp: 1n,
          feeStored: 1n,
        }
        ;[assetOut, collateralOut, feeOut] = await TimeswapMathTestContract.burn(state, liquidityIn)
      })
      it('AssetOut', () => {
        const assetOutComputed = BurnMath.getAsset(stateTest, liquidityIn)
        expect(assetOut == assetOutComputed).to.true
      })
      it('CollateralOut', () => {
        const collateralOutComputed = BurnMath.getCollateral(stateTest, liquidityIn)
        expect(collateralOut == collateralOutComputed).to.true
      })
      it('FeeOut', () => {
        const feeOutComputed = BurnMath.getFee(stateTest, liquidityIn)
        expect(feeOut == feeOutComputed).to.true
      })
    })

    describe('totalAsset < totalBond', () => {
      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        state = {
          reserves: { asset: 90n, collateral: 100n },
          feeStored: 1n,
          totalLiquidity: 100n,
          totalClaims: { bondPrincipal: 50n, bondInterest: 50n, insuranceInterest: 10n, insurancePrincipal: 10n },
          totalDebtCreated: 100n,
          x: 100n,
          y: 10n,
          z: 1n,
        }
        stateTest = {
          reserves: { asset: 90n, collateral: 100n },
          totalLiquidity: 100n,
          totalClaims: { bondPrincipal: 50n, bondInterest: 50n, insuranceInterest: 10n, insurancePrincipal: 10n },
          totalDebtCreated: 100n,
          asset: 100n,
          interest: 10n,
          cdp: 1n,
          feeStored: 1n,
        }
        ;[assetOut, collateralOut, feeOut] = await TimeswapMathTestContract.burn(state, liquidityIn)
      })
      it('AssetOut', () => {
        const assetOutComputed = BurnMath.getAsset(stateTest, liquidityIn)
        expect(assetOut == assetOutComputed).to.true
      })
      it('CollateralOut', () => {
        const collateralOutComputed = BurnMath.getCollateral(stateTest, liquidityIn)
        expect(collateralOut == collateralOutComputed).to.true
      })
      it('FeeOut', () => {
        const feeOutComputed = BurnMath.getFee(stateTest, liquidityIn)
        expect(feeOut == feeOutComputed).to.true
      })
    })

    describe('totalAsset < totalBond; collateral*bond < deficit * totalInsurance', () => {
      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        state = {
          reserves: { asset: 90n, collateral: 100n },
          feeStored: 1n,
          totalLiquidity: 100n,
          totalClaims: { bondPrincipal: 50n, bondInterest: 50n, insuranceInterest: 1000n, insurancePrincipal: 1000n },
          totalDebtCreated: 100n,
          x: 100n,
          y: 10n,
          z: 1n,
        }
        stateTest = {
          reserves: { asset: 90n, collateral: 100n },
          totalLiquidity: 100n,
          totalClaims: { bondPrincipal: 50n, bondInterest: 50n, insuranceInterest: 1000n, insurancePrincipal: 1000n },
          totalDebtCreated: 100n,
          asset: 100n,
          interest: 10n,
          cdp: 1n,
          feeStored: 1n,
        }
        ;[assetOut, collateralOut, feeOut] = await TimeswapMathTestContract.burn(state, liquidityIn)
      })
      it('AssetOut', () => {
        const assetOutComputed = BurnMath.getAsset(stateTest, liquidityIn)
        expect(assetOut == assetOutComputed).to.true
      })
      it('CollateralOut', () => {
        const collateralOutComputed = BurnMath.getCollateral(stateTest, liquidityIn)
        expect(collateralOut == collateralOutComputed).to.true
      })
      it('FeeOut', () => {
        const feeOutComputed = BurnMath.getFee(stateTest, liquidityIn)
        expect(feeOut == feeOutComputed).to.true
      })
    })
  })

  describe('Lend Math', () => {
    const state: IPair.StateStruct = {
      reserves: { asset: 10n, collateral: 10n },
      feeStored: 10n,
      totalLiquidity: 10n,
      totalClaims: { bondPrincipal: 1n, bondInterest: 9n, insurancePrincipal: 1n, insuranceInterest: 9n },
      totalDebtCreated: 10n,
      x: 10n,
      y: 10n,
      z: 10n,
    }
    const stateTest: StateTestParams = {
      reserves: { asset: 10n, collateral: 10n },
      totalLiquidity: 10n,
      totalClaims: { bondPrincipal: 1n, bondInterest: 9n, insurancePrincipal: 1n, insuranceInterest: 9n },
      totalDebtCreated: 10n,
      asset: 10n,
      interest: 10n,
      cdp: 10n,
    }
    const xIncrease = 2000n
    const yDecrease = 1n
    const zDecrease = 1n
    const fee = 2n
    const protocolFee = 1n
    let result: any

    before('', async () => {
      signers = await ethers.getSigners()
      maturity = (await now()) + 10000n
      const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
      const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
      const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
        libraries: {
          TimeswapMath: TimeswapMathContract.address,
        },
      })
      TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
      await TimeswapMathTestContract.deployed()
      result = await TimeswapMathTestContract.lend(maturity, state, xIncrease, yDecrease, zDecrease, fee, protocolFee)
    })
    it('bondInterest', async () => {
      const bondInterest = LendMath.getBondInterest(maturity as bigint, yDecrease, await now())
      expect(result[0].bondInterest.eq(bondInterest)).to.true
    })
    it('insurancePrincipal', async () => {
      const insurancePrincipal = LendMath.getInsurancePrincipal(stateTest, xIncrease)
      expect(result[0].insurancePrincipal.eq(insurancePrincipal)).to.true
    })
    it('insuranceInterest', async () => {
      const insuranceInterest = LendMath.getInsuranceInterest(maturity as bigint, yDecrease, await now())
      expect(result[0].insuranceInterest.eq(insuranceInterest)).to.true
    })
    it('Fees', async () => {
      const { feeStoredIncrease, protocolFeeStoredIncrease } = LendMath.getFees(
        maturity as bigint,
        xIncrease,
        fee,
        protocolFee,
        await now()
      )
      expect(result[1].eq(feeStoredIncrease)).to.true
      expect(result[2].eq(protocolFeeStoredIncrease)).to.true
    })
  })

  describe('Withdraw Math', () => {
    describe('totalAssets > totalBond', () => {
      const state = {
        reserves: { asset: 1000n, collateral: 1000n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 100n, bondInterest: 100n, insuranceInterest: 100n, insurancePrincipal: 100n },
        totalDebtCreated: 300n,
        x: 5000n,
        y: 10000n,
        z: 10000n,
        feeStored: 10n,
      }
      const stateTest: State = {
        reserves: { asset: 1000n, collateral: 1000n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 100n, bondInterest: 100n, insuranceInterest: 100n, insurancePrincipal: 100n },
        totalDebtCreated: 300n,
        asset: 5000n,
        interest: 10000n,
        cdp: 10000n,
        feeStored: 10n,
      }
      const claimsIn = {
        bondPrincipal: 10n,
        bondInterest: 10n,
        insuranceInterest: 10n,
        insurancePrincipal: 10n,
      }
      let result: any

      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()

        result = await TimeswapMathTestContract.withdraw(state, claimsIn)
      })
      it('tokens out', () => {
        const tokensOut = WithdrawMath.getTokensOut(stateTest, claimsIn)
        expect(result[0].eq(tokensOut.asset)).to.true
        expect(result[1].eq(tokensOut.collateral)).to.true
      })
    })

    describe('totalAssets == totalBond', () => {
      const state = {
        reserves: { asset: 1000n, collateral: 1000n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 500n, bondInterest: 500n, insuranceInterest: 100n, insurancePrincipal: 100n },
        totalDebtCreated: 300n,
        x: 5000n,
        y: 10000n,
        z: 10000n,
        feeStored: 10n,
      }
      const stateTest: State = {
        reserves: { asset: 1000n, collateral: 1000n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 500n, bondInterest: 500n, insuranceInterest: 100n, insurancePrincipal: 100n },
        totalDebtCreated: 300n,
        asset: 5000n,
        interest: 10000n,
        cdp: 10000n,
        feeStored: 10n,
      }
      const claimsIn = {
        bondPrincipal: 10n,
        bondInterest: 10n,
        insuranceInterest: 10n,
        insurancePrincipal: 10n,
      }
      let result: any

      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        result = await TimeswapMathTestContract.withdraw(state, claimsIn)
      })
      it('tokens out', () => {
        const tokensOut = WithdrawMath.getTokensOut(stateTest, claimsIn)
        expect(result[0].eq(tokensOut.asset)).to.true
        expect(result[1].eq(tokensOut.collateral)).to.true
      })
    })

    describe('totalAssets < totalBond; totalAsset > BondPrincipal', () => {
      const state = {
        reserves: { asset: 900n, collateral: 1000n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 500n, bondInterest: 500n, insuranceInterest: 100n, insurancePrincipal: 100n },
        totalDebtCreated: 300n,
        x: 5000n,
        y: 10000n,
        z: 10000n,
        feeStored: 10n,
      }
      const stateTest: State = {
        reserves: { asset: 900n, collateral: 1000n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 500n, bondInterest: 500n, insuranceInterest: 100n, insurancePrincipal: 100n },
        totalDebtCreated: 300n,
        asset: 5000n,
        interest: 10000n,
        cdp: 10000n,
        feeStored: 10n,
      }
      const claimsIn = {
        bondPrincipal: 10n,
        bondInterest: 10n,
        insuranceInterest: 10n,
        insurancePrincipal: 10n,
      }
      let result: any

      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        result = await TimeswapMathTestContract.withdraw(state, claimsIn)
      })
      it('tokens out', () => {
        const tokensOut = WithdrawMath.getTokensOut(stateTest, claimsIn)
        expect(result[0].eq(tokensOut.asset)).to.true
        expect(result[1].eq(tokensOut.collateral)).to.true
      })
    })

    describe('totalAssets < totalBond; totalAsset < BondPrincipal', () => {
      const state = {
        reserves: { asset: 900n, collateral: 1000n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 1000n, bondInterest: 500n, insuranceInterest: 100n, insurancePrincipal: 100n },
        totalDebtCreated: 300n,
        x: 5000n,
        y: 10000n,
        z: 10000n,
        feeStored: 10n,
      }
      const stateTest: State = {
        reserves: { asset: 900n, collateral: 1000n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 1000n, bondInterest: 500n, insuranceInterest: 100n, insurancePrincipal: 100n },
        totalDebtCreated: 300n,
        asset: 5000n,
        interest: 10000n,
        cdp: 10000n,
        feeStored: 10n,
      }
      const claimsIn = {
        bondPrincipal: 10n,
        bondInterest: 10n,
        insuranceInterest: 10n,
        insurancePrincipal: 10n,
      }
      let result: any

      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        result = await TimeswapMathTestContract.withdraw(state, claimsIn)
      })
      it('tokens out', () => {
        const tokensOut = WithdrawMath.getTokensOut(stateTest, claimsIn)
        expect(result[0].eq(tokensOut.asset)).to.true
        expect(result[1].eq(tokensOut.collateral)).to.true
      })
    })

    describe('totalAssets < totalBond; totalAsset < BondPrincipal; totalCollateral > totalInsurance', () => {
      const state = {
        reserves: { asset: 900n, collateral: 900n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 1000n, bondInterest: 500n, insuranceInterest: 100n, insurancePrincipal: 100n },
        totalDebtCreated: 300n,
        x: 5000n,
        y: 10000n,
        z: 10000n,
        feeStored: 10n,
      }
      const stateTest: State = {
        reserves: { asset: 900n, collateral: 900n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 1000n, bondInterest: 500n, insuranceInterest: 100n, insurancePrincipal: 100n },
        totalDebtCreated: 300n,
        asset: 5000n,
        interest: 10000n,
        cdp: 10000n,
        feeStored: 10n,
      }
      const claimsIn = {
        bondPrincipal: 10n,
        bondInterest: 10n,
        insuranceInterest: 10n,
        insurancePrincipal: 10n,
      }
      let result: any

      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        result = await TimeswapMathTestContract.withdraw(state, claimsIn)
      })
      it('tokens out', () => {
        const tokensOut = WithdrawMath.getTokensOut(stateTest, claimsIn)
        expect(result[0].eq(tokensOut.asset)).to.true
        expect(result[1].eq(tokensOut.collateral)).to.true
      })
    })

    describe('totalAssets < totalBond; totalAsset < BondPrincipal; totalCollateral < totalInsurance; totalCollateral > totalInsurancePrincipal', () => {
      const state = {
        reserves: { asset: 999n, collateral: 900n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 1000n, bondInterest: 1n, insuranceInterest: 2n, insurancePrincipal: 450449n },
        totalDebtCreated: 300n,
        x: 5000n,
        y: 10000n,
        z: 10000n,
        feeStored: 10n,
      }
      const stateTest: State = {
        reserves: { asset: 999n, collateral: 900n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 1000n, bondInterest: 1n, insuranceInterest: 2n, insurancePrincipal: 450449n },
        totalDebtCreated: 300n,
        asset: 5000n,
        interest: 10000n,
        cdp: 10000n,
        feeStored: 10n,
      }
      const claimsIn = {
        bondPrincipal: 10n,
        bondInterest: 10n,
        insuranceInterest: 10n,
        insurancePrincipal: 10n,
      }
      let result: any

      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        result = await TimeswapMathTestContract.withdraw(state, claimsIn)
      })

      it('tokens out', () => {
        const tokensOut = WithdrawMath.getTokensOut(stateTest, claimsIn)
        expect(result[0].eq(tokensOut.asset)).to.true
        expect(result[1].eq(tokensOut.collateral)).to.true
      })
    })

    describe('totalAssets < totalBond; totalAsset < BondPrincipal; totalCollateral < totalInsurance; totalCollateral < InsurancePrincipal', () => {
      const state = {
        reserves: { asset: 999n, collateral: 900n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 1000n, bondInterest: 1n, insuranceInterest: 10n, insurancePrincipal: 450451n },
        totalDebtCreated: 300n,
        x: 5000n,
        y: 10000n,
        z: 10000n,
        feeStored: 10n,
      }
      const stateTest: State = {
        reserves: { asset: 999n, collateral: 900n },
        totalLiquidity: 500n,
        totalClaims: { bondPrincipal: 1000n, bondInterest: 1n, insuranceInterest: 10n, insurancePrincipal: 450451n },
        totalDebtCreated: 300n,
        asset: 5000n,
        interest: 10000n,
        cdp: 10000n,
        feeStored: 10n,
      }
      const claimsIn = {
        bondPrincipal: 10n,
        bondInterest: 10n,
        insuranceInterest: 10n,
        insurancePrincipal: 10n,
      }
      let result: any

      before('', async () => {
        signers = await ethers.getSigners()
        maturity = (await now()) + 10000n
        const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
        const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
        const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
          libraries: {
            TimeswapMath: TimeswapMathContract.address,
          },
        })
        TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
        await TimeswapMathTestContract.deployed()
        result = await TimeswapMathTestContract.withdraw(state, claimsIn)
      })
      it('tokens out', () => {
        const tokensOut = WithdrawMath.getTokensOut(stateTest, claimsIn)
        expect(result[0].eq(tokensOut.asset)).to.true
        expect(result[1].eq(tokensOut.collateral)).to.true
      })
    })
  })

  describe('Borrow Math', () => {
    const state: IPair.StateStruct = {
      reserves: { asset: 1000n, collateral: 1000n },
      feeStored: 10n,
      totalLiquidity: 100n,
      totalClaims: { bondPrincipal: 10n, bondInterest: 90n, insurancePrincipal: 10n, insuranceInterest: 90n },
      totalDebtCreated: 100n,
      x: 1000n,
      y: 1n,
      z: 1n,
    }
    const stateTest: State = {
      reserves: { asset: 1000n, collateral: 1000n },
      totalLiquidity: 100n,
      totalClaims: { bondPrincipal: 10n, bondInterest: 90n, insurancePrincipal: 10n, insuranceInterest: 90n },
      totalDebtCreated: 100n,
      asset: 1000n,
      interest: 1n,
      cdp: 1n,
      feeStored: 10n,
    }
    const xDecrease = 200n
    const yIncrease = 1n
    const zIncrease = 1n
    const fee = 2n
    const protocolFee = 1n
    let result: any

    before('', async () => {
      signers = await ethers.getSigners()
      maturity = (await now()) + 10000n
      const TimeswapMathContractFactory = await ethers.getContractFactory('TimeswapMath')
      const TimeswapMathContract = await TimeswapMathContractFactory.deploy()
      const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest', {
        libraries: {
          TimeswapMath: TimeswapMathContract.address,
        },
      })
      TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
      await TimeswapMathTestContract.deployed()
      result = await TimeswapMathTestContract.borrow(maturity, state, xDecrease, yIncrease, zIncrease, fee, protocolFee)
    })
    it('debt', async () => {
      const debt = BorrowMath.getDebt(maturity as bigint, xDecrease, yIncrease, await now())
      expect(result[0].debt.eq(debt)).to.true
    })
    it('collateral', async () => {
      const collateral = BorrowMath.getCollateral(maturity as bigint, stateTest, xDecrease, zIncrease, await now())
      expect(result[0].collateral.eq(collateral)).to.true
    })
  })
})
