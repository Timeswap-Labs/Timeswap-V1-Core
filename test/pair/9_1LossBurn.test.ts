import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { expect } from '../shared/Expect'
import { borrowFixture, burnFixture, constructorFixture, lendFixture, mintFixture } from '../shared/Fixtures'
import { advanceTimeAndBlock, now } from '../shared/Helper'
import * as TestCases from '../testCases'
import { MintParams } from '../testCases'
const MaxUint224 = BigNumber.from(2).pow(224).sub(1)
let signers: SignerWithAddress[]
let assetInValue: bigint = BigInt(MaxUint224.toString())
let collateralInValue: bigint = BigInt(MaxUint224.toString())

describe('Loss Burn', () => {
  let tests: any
  let snapshot: any

  before(async () => {
    snapshot = await ethers.provider.send('evm_snapshot', [])
  })

  it('', async () => {
    tests = await TestCases.mint()
    for (let i = 0; i < tests.length; i++) {
      let testCase: any = tests[i]
      console.log('\n', `Checking for Burn Test Case ${i + 1}`)
      await ethers.provider.send('evm_revert', [snapshot])
      await ethers.provider.send('evm_snapshot', [])
      signers = await ethers.getSigners()
      let pair: any
      let pairSim: any
      let updatedMaturity: any
      const currentBlockTime = await now()
      updatedMaturity = currentBlockTime + 31556952n
      const constructor = await constructorFixture(assetInValue, collateralInValue, updatedMaturity)
      const mintParameters: MintParams = {
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
        console.log('Case ignored due to wrong minting parameters')
        continue
      }
      const lendParam = await TestCases.lend(await pair.state())
      let lendTxData: any
      let lendData
      try {
        lendTxData = await lendFixture(mint, signers[0], lendParam)
        pair = lendTxData.pair
        pairSim = lendTxData.pairSim
        lendData = lendTxData.lendData
      } catch (error) {
        console.log('Case ignored due to error in lending')
        continue
      }
      const borrowParams = await TestCases.borrow(await pair.state(), await pair.totalReserves())
      let returnObj: any
      try {
        returnObj = await borrowFixture(lendTxData, signers[0], borrowParams)
      } catch (error) {
        console.log('Case ignored due to error in borrowing')
        continue
      }
      await advanceTimeAndBlock(Number(updatedMaturity))
      const burnParams = { liquidityIn: mint.mintData.liquidityOut }
      try {
        const burn = await burnFixture(returnObj, signers[0], burnParams)
        pair = burn.pair
        pairSim = burn.pairSim
      } catch (error) {
        console.log('error in burning')
        continue
      }
      if (pair != undefined && pairSim != undefined) {
        console.log(`Testing for Burn Success Case: ${i + 1}`)
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
        expect(claims.bondPrincipal).to.equalBigInt(claimsSim.bondPrincipal)
        expect(claims.insurancePrincipal).to.equalBigInt(claimsSim.insurancePrincipal)

        console.log('Should have correct claims of')
        const claimsOf = await pair.claimsOf(signers[0])
        const claimsOfSim = pairSim.getClaims(pairSim.getPool(updatedMaturity), signers[0].address)
        expect(claimsOf.bondPrincipal).to.equalBigInt(claimsOfSim.bondPrincipal)
        expect(claimsOf.insurancePrincipal).to.equalBigInt(claimsOfSim.insurancePrincipal)

        console.log('Should have correct dues of')
        const duesOf = (await pair.dueOf(0n)).concat(await pair.dueOf(1n))
        const duesOfSim = pairSim.getDues(pairSim.getPool(updatedMaturity), signers[0].address).due
        expect(duesOf.length).to.equal(duesOfSim.length)
        for (let i = 0; i < duesOf.length; i++) {
          expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
          expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
          expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
        }

        console.log('Should have correct feeStored')
        const feeStored = await pair.feeStored()
        const feeStoredSim = pairSim.feeStored(pairSim.getPool(updatedMaturity))
        expect(feeStored.eq(feeStoredSim)).to.true
      }
    }
  })
})
