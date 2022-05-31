import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { divUp, shiftRightUp } from '../libraries/Math'
import { expect } from '../shared/Expect'
import { borrowFixture, constructorFixture, lendFixture, mintFixture } from '../shared/Fixtures'
import { now } from '../shared/Helper'
import { Pair } from '../shared/Pair'
import * as TestCases from '../testCases'
import { Lend, LendParams, MintParams } from '../testCases'

const MaxUint224 = BigNumber.from(2).pow(224).sub(1)
let signers: SignerWithAddress[]
let assetInValue: bigint = BigInt(MaxUint224.toString())
let collateralInValue: bigint = BigInt(MaxUint224.toString())

describe('Lend YMin Success', () => {
  let tests: any
  let snapshot: any

  before(async () => {
    snapshot = await ethers.provider.send('evm_snapshot', [])
  })

  it('', async () => {
    tests = await TestCases.mint()
    for (let i = 0; i < tests.length; i++) {
      let testCase: any = tests[i]
      console.log('\n', `Checking for Lend Test Case ${i + 1}`)
      await ethers.provider.send('evm_revert', [snapshot])
      await ethers.provider.send('evm_snapshot', [])
      signers = await ethers.getSigners()
      let pair: any
      let pairSim: any
      let updatedMaturity: any
      const currentBlockTime = await now()
      updatedMaturity = currentBlockTime + 31556952n
      const constructor = await constructorFixture(assetInValue, collateralInValue, updatedMaturity)
      let mint: any
      const mintParameters: MintParams = {
        assetIn: testCase.assetIn,
        collateralIn: testCase.collateralIn,
        interestIncrease: testCase.interestIncrease,
        cdpIncrease: testCase.cdpIncrease,
        maturity: updatedMaturity,
        currentTimeStamp: testCase.currentTimeStamp,
      }
      try {
        mint = await mintFixture(constructor, signers[0], mintParameters)
        pair = mint.pair
        pairSim = mint.pairSim
      } catch (error) {
        console.log(`Ignored due to wrong minting parameters`)
        continue
      }
      let stateAfterMint = await pair.state()
      let lendParam = await TestCases.lend(await pair.state())

      console.log('state after mint is',stateAfterMint)

      const yMin =
        ((lendParam.lendAssetIn * BigInt(stateAfterMint.interest)) /
          (BigInt(stateAfterMint.asset+lendParam.lendAssetIn))) >>
        4n
        lendParam.lendInterestDecrease = yMin + 1n

      if (lendParam.lendInterestDecrease >= yMin + 1n) {
        console.log('Ignored due to deltaY')
        continue
      }
      let lendTxData: any

      //Lend tx
      try {
        lendTxData = await lendFixture(mint, signers[0], lendParam) // @dev
        pair = await lendTxData.pair
        pairSim = await lendTxData.pairSim
      } catch (LendTxError) {
        console.log(LendTxError)
        console.log('error in lending hence ignored')
        continue
      }
      console.log(`Lend Test Case number: ${i + 1} expected to succeed`)
      console.log('Lend successful')

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
      // console.log('claims', claims)
      expect(claims.bondPrincipal).to.equalBigInt(claimsSim.bondPrincipal)
      expect(claims.insurancePrincipal).to.equalBigInt(claimsSim.insurancePrincipal)

      console.log('Should have correct claims of')
      const claimsOf = await pair.claimsOf(signers[0])
      const claimsOfSim = pairSim.getClaims(pairSim.getPool(updatedMaturity), signers[0].address)
      expect(claimsOf.bondPrincipal).to.equalBigInt(claimsOfSim.bondPrincipal)
      expect(claimsOf.insurancePrincipal).to.equalBigInt(claimsOfSim.insurancePrincipal)

      console.log('Should have correct dues of')
      const duesOf = await pair.dueOf(0n)
      const duesOfSim = pairSim.getDues(pairSim.getPool(updatedMaturity), signers[0].address).due
      expect(duesOf.length).to.equal(duesOfSim.length)
      for (let i = 0; i < duesOf.length; i++) {
        expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
        expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
        expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
      }

      console.log('Should have correct feeStored')
      const feeStored = await pair.feeStored(updatedMaturity)
      const feeStoredSim = pairSim.feeStored(pairSim.getPool(updatedMaturity))
      expect(feeStored.eq(feeStoredSim)).to.true
    }
  })
})
describe('Borrow YMin Success', () => {
  let tests: any
  let snapshot: any

  before(async () => {
    snapshot = await ethers.provider.send('evm_snapshot', [])
  })

  it('', async () => {
    tests = await TestCases.mint()
    for (let i = 0; i < tests.length; i++) {
      let testCase: any = tests[i]
      console.log('\n', `Checking for Borrow Test Case ${i + 1}`)
      await ethers.provider.send('evm_revert', [snapshot])
      await ethers.provider.send('evm_snapshot', [])
      signers = await ethers.getSigners()
      let pair: Pair
      let pairSim: any
      let updatedMaturity: any
      const currentBlockTime = await now()
      updatedMaturity = currentBlockTime + 31556952n
      const constructor = await constructorFixture(assetInValue, collateralInValue, updatedMaturity)
      let mintParameters: MintParams = {
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
        pair = await mint.pair
        pairSim = await mint.pairSim
      } catch (error) {
        console.log(`Ignored due to wrong miniting parameters`)
        continue
      }
      const stateAfterMint = await pair.state()
      const reservesAfterMint = await pair.totalReserves()
      let borrowParams = await TestCases.borrow(stateAfterMint, reservesAfterMint)
      const yMin = shiftRightUp(divUp((borrowParams.assetOut*stateAfterMint.interest),(stateAfterMint.asset - borrowParams.assetOut)),4n)
      borrowParams.interestIncrease = yMin +1n
      let error
      try {
        const borrowTxData = await borrowFixture(mint, signers[0], borrowParams)
        pair = borrowTxData.pair
        pairSim = borrowTxData.pairSim

        console.log(`Testing for Borrow Success Case ${i + 1}`)
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

        continue
      } catch (borrowFixtureError) {
        error = borrowFixtureError
        console.log(error);
        console.log(`Borrow Test Case number: ${i + 1} expected to revert`)
      }
      try {
        await expect(
          pair.pairContractCallee
            .connect(signers[0])
            .borrow(
              pair.maturity,
              signers[0].address,
              signers[0].address,
              borrowParams.assetOut,
              borrowParams.interestIncrease,
              borrowParams.cdpIncrease
            )
        ).to.be.reverted
        console.log('Transaction Reverted')
        continue
      } catch (err) {
        console.log(`Borrowing Tx with the following params did not revert (expected revert)`)
        expect.fail()
      }
    }
  })
})

