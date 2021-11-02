import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Decimal } from 'decimal.js'
import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { expect } from '../shared/Expect'
import { constructorFixture, mintFixture } from '../shared/Fixtures'
import { now } from '../shared/Helper'
import * as TestCases from '../testCases'
import { MintParams } from '../testCases'

Decimal.config({ toExpNeg: 0, toExpPos: 500 })

const MaxUint224 = BigNumber.from(2).pow(224).sub(1)
let signers: SignerWithAddress[]
let assetInValue: bigint = BigInt(MaxUint224.toString()) // creating ERC20 with this number
let collateralInValue: bigint = BigInt(MaxUint224.toString())

describe('Mint', () => {
  let testCases: any
  let caseNumber: any = 0
  let iSuccess = 0
  let iFailure = 0
  let totalFailureCases = 0

  before(async () => {
    signers = await ethers.getSigners()
    testCases = await TestCases.mint()
  })

  it('', async () => {
    testCases.forEach((mintParams: MintParams) => {
      describe('', async () => {
        let pair: any
        let pairSim: any
        let updatedMaturity: any

        before(async () => {
          const currentBlockTime = (await now()) + 500000000n
          updatedMaturity = currentBlockTime
          console.log(`Checking for Mint Test Case ${caseNumber + 1}`)
          try {
            const constructor = await constructorFixture(assetInValue, collateralInValue, updatedMaturity)
            const mint = await mintFixture(constructor, signers[0], mintParams)
            pair = mint.pair
            pairSim = mint.pairSim
            console.log(`Case number: ${caseNumber + 1} expected to succeed`)
          } catch (error) {
            totalFailureCases++
            console.log(`Case number: ${caseNumber + 1} expected to fail`)
            console.log(`Total Failure Cases = ${totalFailureCases}`)
            describe('', async () => {
              before(async () => {
                const constructor = await constructorFixture(assetInValue, collateralInValue, updatedMaturity)
                pair = constructor.pair
                pairSim = constructor.pairSim
              })
              it(``, async () => {
                console.log(`Testing for Mint Failure Case: ${iFailure + 1}`)
                console.log('Transaction expected to revert')
                await expect(
                  pair.pairContractCallee
                    .connect(signers[0])
                    .mint(
                      pair.maturity,
                      signers[0].address,
                      mintParams.assetIn,
                      mintParams.interestIncrease,
                      mintParams.cdpIncrease
                    )
                ).to.be.reverted
                iFailure++
                console.log('Transaction reverted')
              })
            })
          }
        })

        it(``, async () => {
          if (pair != undefined && pairSim != undefined) {
            console.log(`Testing for Mint Success Case ${iSuccess + 1}`)
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
            const duesOf = await pair.dueOf(0n)
            const duesOfSim = pairSim.getDues(pairSim.getPool(updatedMaturity), signers[0].address).due
            expect(duesOf.length).to.equal(duesOfSim.length)
            for (let i = 0; i < duesOf.length; i++) {
              expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
              expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
              expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
            }
            iSuccess++
          }
          caseNumber++
        })
      })
    })
  })
})
