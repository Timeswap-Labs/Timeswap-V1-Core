import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { expect } from '../shared/Expect'
import { borrowFixture, constructorFixture, mintFixture, payFixture } from '../shared/Fixtures'
import { now } from '../shared/Helper'
import * as TestCases from '../testCases'
import { BorrowParams, PayParams } from '../testCases'

const MaxUint224 = BigNumber.from(2).pow(224).sub(1)
let signers: SignerWithAddress[]
let assetInValue: bigint = BigInt(MaxUint224.toString())
let collateralInValue: bigint = BigInt(MaxUint224.toString())

describe('Pay', () => {
  let tests: any
  let snapshot: any

  before(async () => {
    snapshot = await ethers.provider.send('evm_snapshot', [])
  })

  it('', async () => {
    tests = await TestCases.pay()
    for (let i = 0; i < tests.length; i++) {
      let testCase: any = tests[i]
      console.log('\n', `Checking for Pay Test Case ${i + 1}`)
      await ethers.provider.send('evm_revert', [snapshot])
      await ethers.provider.send('evm_snapshot', [])
      signers = await ethers.getSigners()
      let pair: any
      let pairSim: any
      let updatedMaturity: any

      const currentBlockTime = await now()
      updatedMaturity = currentBlockTime + 31556952n
      const constructor = await constructorFixture(assetInValue, collateralInValue, updatedMaturity)
      const mintParameters: any = {
        assetIn: testCase.assetIn,
        collateralIn: testCase.collateralIn,
        interestIncrease: testCase.interestIncrease,
        cdpIncrease: testCase.cdpIncrease,
        maturity: updatedMaturity,
        currentTimeStamp: testCase.currentTimeStamp,
      }
      let mint: any
      try {
        mint = await mintFixture(constructor, signers[0], mintParameters)
        pair = mint.pair
        pairSim = mint.pairSim
      } catch (error) {
        console.log(`Ignored due to wrong miniting parameters`)
        continue
      }
      const borrowParams: BorrowParams = {
        assetOut: testCase.borrowAssetOut,
        collateralIn: testCase.borrowCollateralIn,
        interestIncrease: testCase.borrowInterestIncrease,
        cdpIncrease: testCase.borrowCdpIncrease,
      }
      let debtData: PayParams
      let borrowTxData: any
      try {
        borrowTxData = await borrowFixture(mint, signers[0], borrowParams)
        if (borrowTxData.pair != undefined) {
          pair = borrowTxData.pair
          pairSim = borrowTxData.pairSim
          debtData = {
            ids: [borrowTxData.debtObj.id],
            debtIn: [borrowTxData.debtObj.dueOut.debt],
            collateralOut: [borrowTxData.debtObj.dueOut.collateral],
          }
          try {
            const returnValue = await payFixture(borrowTxData, signers[0], debtData)
            pair = returnValue.pair
            pairSim = returnValue.pairSim
          } catch (error) {
            console.log('Error in Pay')
            console.log(error)
          }
        } else {
          console.log('There was an error in the Borrow Transaction with the following parameters:')
          console.log(testCase)
          continue
        }
      } catch {}
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
      const duesOfSim = [(pairSim.getDues(pairSim.getPool(updatedMaturity), signers[0].address).due[0])]
      const duesOf = await pair.dueOf(0n)
      expect(duesOf.length).to.equal(duesOfSim.length)
      for (let i = 0; i < duesOf.length; i++) {
        expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
        expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
        expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
      }
    }
  })
})
