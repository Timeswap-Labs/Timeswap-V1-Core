import { ethers, waffle } from 'hardhat'
import { advanceTimeAndBlock, now } from '../shared/Helper'
import testCases from './TestCases'
import { expect } from '../shared/Expect'
import { withdrawFixture, constructorFixture, Fixture, mintFixture, lendFixture } from '../shared/Fixtures'

const { loadFixture } = waffle

describe('Withdraw', () => {
  const tests = testCases.withdraw()
  const mintTest = testCases.mint()
  const lendTest = testCases.lend()
  const burnTest = testCases.burn()

  async function fixture(): Promise<Fixture> {
    const constructor = await constructorFixture(10000n, 10000n, (await now()) + 31536000n)
    return constructor
  }

  tests.Success.forEach((withdrawParams, idx) => {
    describe.only(`Success case ${idx + 1} for withdraw`, () => {
      async function fixtureSuccess(): Promise<Fixture> {
        await loadFixture(fixture)

        const signers = await ethers.getSigners()
        const constructor = await loadFixture(fixture)

        const mint = await mintFixture(constructor, signers[0], mintTest.Success[0])
        const lend = await lendFixture(mint, signers[0], lendTest.Success[0].lendParams)

        await advanceTimeAndBlock(31536000)
        const withdraw = await withdrawFixture(
          lend,
          signers[0],
          mintTest.Success[0],
          burnTest.Success[0],
          withdrawParams
        )
        return withdraw
      }

      it('Should have correct total reserves', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const reserves = await pair.totalReserves()
        const reservesSim = pairSim.reserves

        
        
        expect(reserves.asset).to.equalBigInt(reservesSim.asset)
        expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
      })

      it('Should have correct state asset', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const state = await pair.state()
        const stateSim = pairSim.pool.state

        
        

        expect(state.asset).to.equalBigInt(stateSim.asset)
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
    })
  })
})
