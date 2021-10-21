import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { expect } from '../shared/Expect'
import { borrowFixture, constructorFixture, mintFixture, payFixture } from '../shared/Fixtures'
import { now } from '../shared/Helper'
import * as TestCases from '../testCases'
import { Borrow, BorrowParams, PayParams } from '../testCases'

const MaxUint224 = BigNumber.from(2).pow(224).sub(1)
let signers: SignerWithAddress[]
let assetInValue: bigint = BigInt(MaxUint224.toString())
let collateralInValue: bigint = BigInt(MaxUint224.toString())
let totalCases: number
let FailureCases: number

describe('Pay', () => {
  let tests: any
  let caseNumber: any = 0
  let iSuccess = 0
  let iFailure = 0
  let totalFailureCases = 0

  before(async () => {
    signers = await ethers.getSigners()
    tests = await TestCases.pay()
    totalCases = tests.length
    FailureCases = 0
  })

  it('', () => {
    tests.forEach((testCase: Borrow) => {
      describe('', async () => {
        let pair: any
        let pairSim: any
        let updatedMaturity: any

        before(async () => {
          console.log(`Checking for Pay Test Case ${caseNumber + 1}`)
          const currentBlockTime = await now()
          updatedMaturity = currentBlockTime + 500000000n
          try {
            const constructor = await constructorFixture(assetInValue, collateralInValue, updatedMaturity)
            const mintParameters: any = {
              assetIn: testCase.assetIn,
              collateralIn: testCase.collateralIn,
              interestIncrease: testCase.interestIncrease,
              cdpIncrease: testCase.cdpIncrease,
              maturity: updatedMaturity,
              currentTimeStamp: testCase.currentTimeStamp,
            }
            const mint = await mintFixture(constructor, signers[0], mintParameters)
            const borrowParams: BorrowParams = {
              assetOut: testCase.borrowAssetOut,
              collateralIn: testCase.borrowCollateralIn,
              interestIncrease: testCase.borrowInterestIncrease,
              cdpIncrease: testCase.borrowCdpIncrease,
            }
            const borrowTxData = await borrowFixture(mint, signers[1], borrowParams, true);
            
            const debtData: PayParams = {
              ids: [borrowTxData.debtObj.id],
              debtIn: [borrowTxData.debtObj.dueOut.debt],
              collateralOut: [borrowTxData.debtObj.dueOut.collateral],
            }
            const returnValue = await payFixture(borrowTxData, signers[0], debtData, signers[1])
            pair = returnValue.pair
            pairSim = returnValue.pairSim
          } catch (error) {
            console.log(error);
          }
        })

        it('', async () => {
          if (pair != undefined && pairSim != undefined) {
            console.log('Should have correct reserves')
            const reserves = await pair.totalReserves()
            const reservesSim = pairSim.getPool(updatedMaturity).state.reserves
            expect(reserves.asset).to.equalBigInt(reservesSim.asset)
            expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)

            console.log('Should have correct state')
            const state = await pair.state()
            const stateSim = pairSim.getPool(updatedMaturity).state
            expect(state.asset).to.equalBigInt(stateSim.asset)
            expect(state.interest).to.equalBigInt(stateSim.interest)
            expect(state.cdp).to.equalBigInt(stateSim.cdp)

            console.log('Should have correct total liquidity')
            const liquidity = await pair.totalLiquidity()
            const liquiditySim = pairSim.getPool(updatedMaturity).state.totalLiquidity
            expect(liquidity).to.equalBigInt(liquiditySim)

            console.log('Should have correct liquidity of')
            const signers = await ethers.getSigners()
            const liquidityOf = await pair.liquidityOf(signers[0])
            const liquidityOfSim = pairSim.getLiquidity(pairSim.getPool(updatedMaturity), signers[0].address)
            expect(liquidityOf).to.equalBigInt(liquidityOfSim)

            console.log('Should have correct total debt')

            const totalDebtCreated = await pair.totalDebtCreated()
            const totalDebtCreatedSim = pairSim.getPool(updatedMaturity).state.totalDebtCreated
            expect(totalDebtCreated).to.equalBigInt(totalDebtCreatedSim)

            console.log('Should have correct total claims')
            const claims = await pair.totalClaims()
            const claimsSim = pairSim.getPool(updatedMaturity).state.totalClaims
            expect(claims.bond).to.equalBigInt(claimsSim.bond)
            expect(claims.insurance).to.equalBigInt(claimsSim.insurance)

            console.log('Should have correct claims of')

            const claimsOf = await pair.claimsOf(signers[0])
            const claimsOfSim = pairSim.getClaims(pairSim.getPool(updatedMaturity), signers[0].address)
            expect(claimsOf.bond).to.equalBigInt(claimsOfSim.bond)
            expect(claimsOf.insurance).to.equalBigInt(claimsOfSim.insurance)

            console.log('Should have correct dues of')
            const duesOf = await pair.duesOf()
            const duesOfSim = pairSim.getDues(pairSim.getPool(updatedMaturity), signers[0].address).due
            expect(duesOf.length).to.equal(duesOfSim.length)
            for (let i = 0; i < duesOf.length; i++) {
              expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
              expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
              expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
            }
          }
        })
      })
    })
  })
})
