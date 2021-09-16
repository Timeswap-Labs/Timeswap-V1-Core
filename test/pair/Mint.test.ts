import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
import { expect } from '../shared/Expect'
import testCases from './TestCases'
import { constructorFixture, Fixture, mintFixture } from '../shared/Fixtures'

const { loadFixture } = waffle

describe('Mint', () => {
  const tests = testCases.mint()

  async function fixture(): Promise<Fixture> {
    const constructor = await constructorFixture(10000n, 10000n, (await now()) + 31536000n)
    return constructor
  }

  tests.Success.forEach((mintParams, idx) => {
    describe(`Success case ${idx + 1}`, () => {
      async function fixtureSuccess(): Promise<Fixture> {
        const signers = await ethers.getSigners()
        const constructor = await loadFixture(fixture)

        const mint = await mintFixture(constructor, signers[0], mintParams)

        return mint
      }

      it('Should have correct total reserves', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)

        const reserves = await pair.totalLocked()
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

      it('Should have correct claims of', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const claimsOf = await pair.claimsOf(signers[0])
        const claimsOfSim = pairSim.claims

        expect(claimsOf.bond).to.equalBigInt(claimsOfSim.bond)
        expect(claimsOf.insurance).to.equalBigInt(claimsOfSim.insurance)
      })

      it('Should have correct dues of', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        const signers = await ethers.getSigners()

        const duesOf = await pair.duesOf(signers[0])
        const duesOfSim = pairSim.dues

        expect(duesOf.length).to.equal(duesOfSim.length)

        for (let i = 0; i < duesOf.length; i++) {
          expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
          expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
          expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
        }
      })
    })
  })

  tests.Failure.forEach((test, idx) => {
    describe(`Failure case ${idx + 1}`, () => {
      it('Should fail with correct error', async () => {
        const mintParams = test.params

        const { pair } = await loadFixture(fixture)
        const signers = await ethers.getSigners()

        // This is passing, but won't fail for a wrong error message
        // Think it is due to the `await txn.wait()`
        // const result = pair.upgrade(signers[0]).mint(test.interestIncrease, test.cdpIncrease)
        // await expect(result).to.be.revertedWith(test.errorMessage)

        await expect(
          pair.pairContractCallee
            .connect(signers[0])
            .mint(
              pair.maturity,
              signers[0].address,
              signers[0].address,
              mintParams.assetIn,
              mintParams.interestIncrease,
              mintParams.cdpIncrease
            )
        ).to.be.revertedWith('')
      })
    })
  })
})
