import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
import { constructorFixture, Fixture, lendFixture, mintFixture } from '../shared/Fixtures'
import testCases from './TestCases'
import { expect } from '../shared/Expect'

const { loadFixture, solidity } = waffle
chai.use(solidity)
//TODO: Check why chai's native assertion library isnt working and remove the helper function
function checkBigIntEquality(x: bigint, y: bigint){
  expect(x.toString()).to.equal(y.toString());
}

describe('Lend', () => {
  const tests = testCases.lend()

  async function fixture(): Promise<Fixture> {
    const constructor = await constructorFixture(10000n, 10000n, (await now()) + 31536000n)
    return constructor
  }

  tests.Success.forEach((test, idx) => {
    describe(`Success case ${idx + 1}`, () => {
      async function fixtureSuccess(): Promise<Fixture> {
        const { mintParams, lendParams } = test

        const signers = await ethers.getSigners()
        const constructor = await loadFixture(fixture)

        const mint = await mintFixture(constructor, signers[0], mintParams)
        const lend = await lendFixture(mint, signers[0], lendParams)

        return lend
      }

      it('Should have correct total reserves', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const reserves = await pair.totalReserves()
        const reservesSim = pairSim.reserves
        checkBigIntEquality(reserves.asset,reservesSim.asset)
        checkBigIntEquality(reserves.collateral,reservesSim.collateral)
      })

      it('Should have correct state', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const state = await pair.state()
        
        const stateSim = pairSim.pool.state
        
        
        checkBigIntEquality(state.asset,stateSim.asset);
        checkBigIntEquality(state.interest,stateSim.interest);
        checkBigIntEquality(state.cdp,stateSim.cdp);
      })


      it('Should have correct total liquidity', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const liquidity = await pair.totalLiquidity()
        const liquiditySim = pairSim.pool.totalLiquidity

        checkBigIntEquality(liquidity,liquiditySim)
      })

      it('Should have correct liquidity of', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const liquidityOf = await pair.liquidityOf(signers[0])
        const liquidityOfSim = pairSim.pool.senderLiquidity

        checkBigIntEquality(liquidityOf,liquidityOfSim)
      })

      it('Should have correct total claims', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const claims = await pair.totalClaims()
        const claimsSim = pairSim.pool.totalClaims

        checkBigIntEquality(claims.bond,claimsSim.bond)
        checkBigIntEquality(claims.insurance,claimsSim.insurance)
      })

      it('Should have correct claims of', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const claimsOf = await pair.claimsOf(signers[0])
        const claimsOfSim = pairSim.claims

        checkBigIntEquality(claimsOf.bond,claimsOfSim.bond)
        checkBigIntEquality(claimsOf.insurance,claimsOfSim.insurance)
      })

      it('Should have correct dues of', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const duesOf = await pair.duesOf(signers[0])
        const duesOfSim = pairSim.dues

        expect(duesOf.length).to.equal(duesOfSim.length)

        for (let i = 0; i < duesOf.length; i++) {
          checkBigIntEquality(duesOf[i].collateral,duesOfSim[i].collateral)
          checkBigIntEquality(duesOf[i].debt,duesOfSim[i].debt)
          checkBigIntEquality(duesOf[i].startBlock,duesOfSim[i].startBlock)
        }
      })
    })
  })
})
