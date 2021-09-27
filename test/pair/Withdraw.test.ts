import { ethers, waffle } from 'hardhat'
import { advanceTimeAndBlock, now } from '../shared/Helper'
import testCases from '../testCases/TestCases'
import { expect } from '../shared/Expect'
import { withdrawFixture, constructorFixture, Fixture, mintFixture, lendFixture, borrowFixture } from '../shared/Fixtures'

const { loadFixture } = waffle

//TODO: Check why chai's native assertion library isnt working and remove the helper function
function checkBigIntEquality(x: bigint, y: bigint){
  expect(x.toString()).to.equal(y.toString());
}
describe('Withdraw', () => {
  let maturity = 0n;
  const tests = testCases.withdraw()
  const mintTest = testCases.mint()
  const lendTest = testCases.lend()
  const borrowTest = testCases.borrow()
  const burnTest = testCases.burn()

  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    const constructor = await constructorFixture(100000n, 100000n, maturity)  // setting up the contract 
    return constructor
  }

  tests.Success.forEach((withdrawParams, idx) => {
    describe(`Success case ${idx + 1} for withdraw`, () => {
      async function fixtureSuccess(): Promise<Fixture> {
        const signers = await ethers.getSigners()
        const constructor = await loadFixture(fixture)

        // we are providing liquidity from account[0]
        const mint = await mintFixture(constructor, signers[0], mintTest.Success[0]) 
        // we are then lending to the pool from a account[1]
        console.log("Doing the lend tx");
        const lend = await lendFixture(mint, signers[1], lendTest.Success[0].lendParams);
        // we are now borrowing from the pool from account[2]
        console.log("Doing the borrow tx");
        const borrow = await borrowFixture(lend,signers[2],borrowTest.Success[0].borrowParams)
        await advanceTimeAndBlock(31536001);
        // we are now withdrawing from the pool using account[1]
        console.log("Doing the withdraw tx");
        const withdraw = await withdrawFixture(
          borrow,
          signers[1],
          withdrawParams
        )
        return withdraw
      }

      it('Should have correct total reserves', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const reserves = await pair.totalReserves()
        const reservesSim = pairSim.getPool(maturity).state.reserves;
        expect(reserves.asset).to.equalBigInt(reservesSim.asset)
        expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
      })

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
      // it('Should have correct total debt', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
      //   const signers = await ethers.getSigners()

      //   const totalDebtCreated = await pair.totalDebtCreated()
      //   const totalDebtCreatedSim = pairSim.pool.totalDebt

      //   checkBigIntEquality(totalDebtCreated,totalDebtCreatedSim)
      // })

      // it('Should have correct total claims', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const claims = await pair.totalClaims()
      //   const claimsSim = pairSim.pool.totalClaims
        
        

      //   expect(claims.bond).to.equalBigInt(claimsSim.bond)
      //   expect(claims.insurance).to.equalBigInt(claimsSim.insurance)
      // })
    })
  })
})
