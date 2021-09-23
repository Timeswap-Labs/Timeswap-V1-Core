import { ethers, waffle } from 'hardhat'
import { now , advanceTimeAndBlock} from '../shared/Helper'
import testCases from './TestCases'
import { expect } from '../shared/Expect'
import { burnFixture, mintFixture,constructorFixture, Fixture } from '../shared/Fixtures'

const { loadFixture } = waffle

describe('Burn', () => {
  const tests = testCases.burn()
  const mintTest = testCases.mint()
  async function fixture(): Promise<Fixture> {
    const constructor = await constructorFixture(10000n, 10000n, (await now()) + 31536000n)
    return constructor
  }

  tests.Success.forEach((burnParams, idx) => {
    describe(`Success case ${idx + 1} for burn`, () => {
      async function fixtureSuccess(): Promise<Fixture> {
        await loadFixture(fixture)

        const signers = await ethers.getSigners()
        const constructor = await loadFixture(fixture)

        const mint = await mintFixture(constructor, signers[0], mintTest.Success[0]);
        advanceTimeAndBlock(31536000)

        const burn = await burnFixture(mint,signers[0],burnParams)
        return burn
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

  tests.Failure.forEach((burnParams, idx) => {
    describe(`Failure case ${idx + 1}`, () => {
      async function fixtureFailure(): Promise<Fixture> {
        await loadFixture(fixture)

        const signers = await ethers.getSigners()
        const constructor = await loadFixture(fixture)
        const mint = await mintFixture(constructor, signers[0], mintTest.Success[0]);
        advanceTimeAndBlock(31536000)
        const burn = await burnFixture(constructor, signers[0], burnParams.params)
        return burn
      }

      it('Should revert when liquidityIn is less than or equal to 0', async () => {
        const { pair } = await loadFixture(fixtureFailure)
        const signers = await ethers.getSigners()
        const result = pair.upgrade(signers[0]).burn(0n)
        await expect(result).to.be.revertedWith(burnParams.errorMessage)
      })
    })
  })

  //TODO: this is not needed, duplicate from the constructor?
  it('Should be a proper address', async () => {
    const { pair } = await loadFixture(fixture)
    expect(pair.pairContractCallee.address).to.be.properAddress
  })

  it('Should have proper factory address', async () => {
    const { pair } = await loadFixture(fixture)

    const result = await pair.pairContract.factory()
    expect(result).to.be.properAddress
  })
})
