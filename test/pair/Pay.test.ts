import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { advanceTimeAndBlock, now } from '../shared/Helper'
import testCases from './TestCases'
import { expect } from '../shared/Expect'
import { payFixture, constructorFixture, Fixture, mintFixture, borrowFixture, lendFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const { loadFixture, solidity } = waffle
let maturity  = 0n
let signers: SignerWithAddress[]= []
//TODO: Check why chai's native assertion library isnt working and remove the helper function
function checkBigIntEquality(x: bigint, y: bigint) {
  expect(x.toString()).to.equal(y.toString());
}

describe('Pay', () => {
  //TODO: to work on the payTests
  // const payTests = testCases.pay();
  const tests = {
    Success: [
      {
        mintParams:
        {
          assetIn: 2000n,
          collateralIn: 800n,
          interestIncrease: 20n,
          cdpIncrease: 400n
        },
        borrowParams:
        {
          assetOut: 200n,
          collateralIn: 72n,
          interestIncrease: 1n,
          cdpIncrease: 2n
        },
        payParams:
          { ids: [0n], debtIn: [200n], collateralOut: [50n] } //FIXME: we have changed the collateralOut
      }
    ],
  };

  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()
    const constructor = await constructorFixture(10000n, 10000n, (await now()) + 31536000n)
    //return { pair, pairSim, assetToken, collateralToken }
    return constructor
  }


  // TODO: we are getting an object of mintCases, BorrowCases and payCases
  // TODO: Need to restructure the testCases.pay to send in an array of the test cases
  tests.Success.forEach((test, idx) => {
    describe(`Success case ${idx + 1} for pay`, () => {
      async function fixtureSuccess(): Promise<Fixture> {
        const { mintParams, borrowParams, payParams } = test

        const signers = await ethers.getSigners()
        const constructor = await loadFixture(fixture)

        const mint = await mintFixture(constructor, signers[0], mintParams)
        
        const borrow = await borrowFixture(mint, signers[0], borrowParams)
        await advanceTimeAndBlock(31535000)  // pushing the time ahead
        const pay = await payFixture(
          borrow,
          signers[0],
          payParams
        )
        return pay
      }
      it('Should have correct total reserves', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const reserves = await pair.totalReserves()
        const reservesSim = pairSim.getPool(maturity).state.reserves

        checkBigIntEquality(reserves.asset,reservesSim.asset)
        checkBigIntEquality(reserves.collateral,reservesSim.collateral)
      })

      it('Should have correct state', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const state = await pair.state()
        const stateSim = pairSim.getPool(maturity).state

        checkBigIntEquality(state.asset,stateSim.asset)
        checkBigIntEquality(state.interest,stateSim.interest)
        checkBigIntEquality(state.cdp,stateSim.cdp)
      })


      it('Should have correct total liquidity', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const liquidity = await pair.totalLiquidity()
        const liquiditySim = pairSim.getPool(maturity).state.totalLiquidity

        checkBigIntEquality(liquidity,liquiditySim)
      })

      it('Should have correct liquidity of', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const liquidityOf = await pair.liquidityOf(signers[0])
        const liquidityOfSim = pairSim.getLiquidity(pairSim.getPool(maturity), signers[0].address)

        checkBigIntEquality(liquidityOf,liquidityOfSim)
      })
      it('Should have correct total debt', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const totalDebtCreated = await pair.totalDebtCreated()
        const totalDebtCreatedSim = pairSim.getPool(maturity).state.totalDebtCreated

        checkBigIntEquality(totalDebtCreated,totalDebtCreatedSim)
      })
      it('Should have correct total claims', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const claims = await pair.totalClaims()
        const claimsSim = pairSim.getPool(maturity).state.totalClaims

        checkBigIntEquality(claims.bond,claimsSim.bond)
        checkBigIntEquality(claims.insurance,claimsSim.insurance)
      })

      it('Should have correct claims of', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const claimsOf = await pair.claimsOf(signers[0])
        const claimsOfSim = pairSim.getClaims(pairSim.getPool(maturity),signers[0].address)

        checkBigIntEquality(claimsOf.bond,claimsOfSim.bond)
        checkBigIntEquality(claimsOf.insurance,claimsOfSim.insurance)
      })

      it('Should have correct dues of', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const duesOf = await pair.duesOf()
        const duesOfSim = pairSim.getDues(pairSim.getPool(maturity),signers[0].address).due

        expect(duesOf.length).to.equal(duesOfSim.length)

        for (let i = 0; i < duesOf.length; i++) {
          checkBigIntEquality(duesOf[i].collateral,duesOfSim[i].collateral)
          checkBigIntEquality(duesOf[i].debt,duesOfSim[i].debt)
          checkBigIntEquality(duesOf[i].startBlock,duesOfSim[i].startBlock)
        }
      })
    })

    // })
  })
  })