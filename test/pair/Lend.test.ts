import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { getBlock, now } from '../shared/Helper'
import { Pair } from '../shared/Pair'
import { PairSim } from '../shared/PairSim'
import { constructorFixture, Fixture, lendFixture, mintFixture } from '../shared/Fixtures'
import testCases from './TestCases'

import type { TestToken } from '../../typechain/TestToken'

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

      it.only('Should have correct total reserves', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const reserves = await pair.totalReserves()
        const reservesSim = pairSim.reserves

        expect(reserves.asset).to.equalBigInt(reservesSim.asset)
        expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
      })

      it('Should have correct state', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const state = await pair.state()
        const stateSim = pairSim.pool.state

        expect(state.asset).to.equalBigInt(stateSim.asset)
        expect(state.interest).to.equalBigInt(stateSim.interest)
        expect(state.cdp).to.equalBigInt(stateSim.cdp)
      })

      it('Should have correct total locked', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const locked = await pair.totalLocked()
        const lockedSim = pairSim.pool.lock

        expect(locked.asset).to.equalBigInt(lockedSim.asset)
        expect(locked.collateral).to.equalBigInt(lockedSim.collateral)
      })

      it('Should have correct total liquidity', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const liquidity = await pair.totalLiquidity()
        const liquiditySim = pairSim.pool.totalLiquidity

        expect(liquidity).to.equalBigInt(liquiditySim)
      })

      it('Should have correct liquidity of', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const liquidityOf = await pair.liquidityOf(signers[0])
        const liquidityOfSim = pairSim.pool.senderLiquidity

        expect(liquidityOf).to.equalBigInt(liquidityOfSim)
      })

      it('Should have correct total claims', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const claims = await pair.totalClaims()
        const claimsSim = pairSim.pool.totalClaims

        expect(claims.bond).to.equalBigInt(claimsSim.bond)
        expect(claims.insurance).to.equalBigInt(claimsSim.insurance)
      })

      // it('Sample test', async () => {
      //   const { pair } = await loadFixture(fixtureSuccess)
      // })
    })
  })
})
