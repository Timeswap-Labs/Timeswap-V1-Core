import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { advanceTimeAndBlock, now } from '../shared/Helper'
import testCases from './TestCases'
import { expect } from '../shared/Expect'
import { payFixture, constructorFixture, Fixture, mintFixture, borrowFixture, lendFixture } from '../shared/Fixtures'

const { loadFixture, solidity } = waffle
chai.use(solidity)
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
          { ids: [1n], debtIn: [200n], collateralOut: [72n] }
      }
    ],
  };

  async function fixture(): Promise<Fixture> {
    const constructor = await constructorFixture(10000n, 10000n, (await now()) + 31536000n)
    return constructor
  }

  // it('to be deleted', async () => {
  //   console.log("PayTests:", tests);
  // })

  // TODO: we are getting an object of mintCases, BorrowCases and payCases
  // TODO: Need to restructure the testCases.pay to send in an array of the test cases
  tests.Success.forEach((test, idx) => {
    describe.only(`Success case ${idx + 1} for pay`, () => {
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
        console.log(pay);
        return pay
      }

      it('to be deleted', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
      })

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
  })
})
