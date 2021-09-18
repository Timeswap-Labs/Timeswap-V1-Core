import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
import { constructorFixture, Fixture, lendFixture, mintFixture } from '../shared/Fixtures'
import testCases from './TestCases'

const { loadFixture, solidity } = waffle
chai.use(solidity)
const { expect } = chai

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

        expect(reserves.asset).to.equal(reservesSim.asset)
        expect(reserves.collateral).to.equal(reservesSim.collateral)
      })

      it('Should have correct state', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const state = await pair.state()
        const stateSim = pairSim.pool.state

        expect(state.asset).to.equal(stateSim.asset)
        expect(state.interest).to.equal(stateSim.interest)
        // expect(state.cdp).to.equal(stateSim.cdp)
      })

      // it('Should have correct total locked', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const locked = await pair.totalReserves()
      //   const lockedSim = pairSim.pool.lock

      //   expect(locked.asset).to.equal(lockedSim.asset)
      //   expect(locked.collateral).to.equal(lockedSim.collateral)
      // })

      // it('Should have correct total liquidity', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const liquidity = await pair.totalLiquidity()
      //   const liquiditySim = pairSim.pool.totalLiquidity

      //   expect(liquidity).to.equal(liquiditySim)
      // })

      // it('Should have correct liquidity of', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
      //   const signers = await ethers.getSigners()

      //   const liquidityOf = await pair.liquidityOf(signers[0])
      //   const liquidityOfSim = pairSim.pool.senderLiquidity

      //   expect(liquidityOf).to.equal(liquidityOfSim)
      // })

      // it('Should have correct total claims', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const claims = await pair.totalClaims()
      //   const claimsSim = pairSim.pool.totalClaims

      //   expect(claims.bond).to.equal(claimsSim.bond)
      //   expect(claims.insurance).to.equal(claimsSim.insurance)
      // })

      // it('Should have correct claims of', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
      //   const signers = await ethers.getSigners()

      //   const claimsOf = await pair.claimsOf(signers[0])
      //   const claimsOfSim = pairSim.claims

      //   expect(claimsOf.bond).to.equal(claimsOfSim.bond)
      //   expect(claimsOf.insurance).to.equal(claimsOfSim.insurance)
      // })

      // it('Should have correct dues of', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
      //   const signers = await ethers.getSigners()

      //   const duesOf = await pair.duesOf(signers[0])
      //   const duesOfSim = pairSim.dues

      //   expect(duesOf.length).to.equal(duesOfSim.length)

      //   for (let i = 0; i < duesOf.length; i++) {
      //     expect(duesOf[i].collateral).to.equal(duesOfSim[i].collateral)
      //     expect(duesOf[i].debt).to.equal(duesOfSim[i].debt)
      //     expect(duesOf[i].startBlock).to.equal(duesOfSim[i].startBlock)
      //   }
      // })
    })
  })
})
