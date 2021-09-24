import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { advanceTimeAndBlock, now } from '../shared/Helper'
import testCases from '../testCases/TestCases'
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
          { ids: [0n], debtIn: [200n], collateralOut: [50n] } //FIXME: we have changed the collateralOut
      }
    ],
  };

  async function fixture(): Promise<Fixture> {
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
        const reservesSim = pairSim.reserves // pairSim is not getting the reserves (the assets)

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
      it('Should have correct total debt', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const totalDebtCreated = await pair.totalDebtCreated()
        const totalDebtCreatedSim = pairSim.pool.totalDebt

        checkBigIntEquality(totalDebtCreated,totalDebtCreatedSim)
      })

      it('Should have correct total claims', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const claims = await pair.totalClaims()
        const claimsSim = pairSim.pool.totalClaims



        expect(claims.bond).to.equalBigInt(claimsSim.bond)
        expect(claims.insurance).to.equalBigInt(claimsSim.insurance)
      })
    })
    // })
  })
  describe(`Failure case`, () => {
    it('Should fail with correct error', async () => {
      const {mintParams, borrowParams, payParams} = tests.Success[0]

      const constructor = await loadFixture(fixture)
      const signers = await ethers.getSigners()

      // This is passing, but won't fail for a wrong error message
      // Think it is due to the `await txn.wait()`
      // const result = pair.upgrade(signers[0]).mint(test.interestIncrease, test.cdpIncrease)
      // await expect(result).to.be.revertedWith(test.errorMessage)
      const mint = await mintFixture(constructor,signers[0],mintParams)
      const {pair} =await borrowFixture(mint,signers[0],borrowParams,true)
      await expect( pair.pairContractCallee
      .connect(signers[0])
      .pay(
        pair.maturity,
        signers[0].address,
        signers[0].address,
        payParams.ids,
        payParams.debtIn,
        payParams.collateralOut
      )
    ).to.be.revertedWith('Forbidden');
  })
})

  })