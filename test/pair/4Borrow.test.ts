import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { expect } from '../shared/Expect'
import { borrowFixture, constructorFixture, mintFixture } from '../shared/Fixtures'
import { now } from '../shared/Helper'
import { Pair } from '../shared/Pair'
import * as TestCases from '../testCases'
import { BorrowParams, MintParams } from '../testCases'
const MaxUint224 = BigNumber.from(2).pow(224).sub(1)
let signers: SignerWithAddress[]
let assetInValue: bigint = BigInt(MaxUint224.toString())
let collateralInValue: bigint = BigInt(MaxUint224.toString())

describe('Borrow', () => {
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
      // mintParameters = {
      //     assetIn: 2648728184194027714900000000000000n,
      //     collateralIn: 3774192276233360975400000000000000n,
      //     interestIncrease: 4774530983753534921700000000000000n,
      //     cdpIncrease: 1524234782014559790200000000000000n,
      //     maturity: 1679232185n,
      //     currentTimeStamp: 1647675233n
      // }
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
      // borrowParams = {
      //   assetOut: 6756250141049202917100000000000n,
      //   borrowCollateralIn: 2256370335146184154400000000000000n,
      //   interestIncrease: 3139760408365147470900000000000n,
      //   cdpIncrease: 3414621487706639065700000000000n
      // }
      let error
      try {
        const borrowTxData = await borrowFixture(mint, signers[0], borrowParams)
        // console.log("successful borrow for case number:", i + 1);
        // console.log(borrowParams);
        // console.log("-----------");
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
        console.log(testCase)
        expect.fail()
      }
    }
  })
})
