import { ethers, waffle } from 'hardhat'
import { advanceTimeAndBlock, now } from '../shared/Helper'
import testCases from './TestCases'
import { expect } from '../shared/Expect'
import { payFixture, constructorFixture, Fixture, mintFixture, borrowFixture, lendFixture } from '../shared/Fixtures'

const { loadFixture } = waffle

describe('Pay', () => {
  const tests = testCases.pay();

  async function fixture(): Promise<Fixture> {
    const constructor = await constructorFixture(10000n, 10000n, (await now()) + 31536000n)
    return constructor
  }

  // TODO: we are getting an object of mintCases, BorrowCases and payCases
  // TODO: Need to restructur the testCases.pay to send in an array of the test cases
  tests.Success.forEach((params, idx) => {
    describe.only(`Success case ${idx + 1} for pay`, () => {
      async function fixtureSuccess(): Promise<Fixture> {

        const signers = await ethers.getSigners()
        const constructor = await loadFixture(fixture)

        const mint = await mintFixture(constructor, signers[0], params.mintParams)
        // neeed to add the lend params also // not necessary though but just to add more liquidity 
        const borrow = await borrowFixture(mint, signers[0], params.borrowParams) // borrowing from the contract

        await advanceTimeAndBlock(31536000)  // pushing the time ahead
        const pay = await payFixture( // paying back the loan
          borrow,
          signers[0],
          params.payParams
        )
        return pay
      }


      // it('Should have correct total reserves', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const reserves = await pair.totalReserves()
      //   const reservesSim = pairSim.reserves

        
        
      //   expect(reserves.asset).to.equalBigInt(reservesSim.asset)
      //   expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
      // })

      // it('Should have correct state asset', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const state = await pair.state()
      //   const stateSim = pairSim.pool.state

        
        

      //   expect(state.asset).to.equalBigInt(stateSim.asset)
      // })

      // it('Should have correct total liquidity', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const liquidity = await pair.totalLiquidity()
      //   const liquiditySim = pairSim.pool.totalLiquidity

      //   expect(liquidity).to.equalBigInt(liquiditySim)
      // })

      // it('Should have correct liquidity of', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
      //   const signers = await ethers.getSigners()

      //   const liquidityOf = await pair.liquidityOf(signers[0])
      //   const liquidityOfSim = pairSim.pool.senderLiquidity

      //   expect(liquidityOf).to.equalBigInt(liquidityOfSim)
      // })

      // it('Should have correct total claims', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const claims = await pair.totalClaims()
      //   const claimsSim = pairSim.pool.totalClaims
        
        

      //   expect(claims.bond).to.equalBigInt(claimsSim.bond)
      //   expect(claims.insurance).to.equalBigInt(claimsSim.insurance)
      // })
    })
  // })
// })
