import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { advanceTimeAndBlock, getBlock, now } from '../shared/Helper'
import { Pair, pairInit } from '../shared/Pair'
import { testTokenNew } from '../shared/TestToken'
import testCases from './TestCases'
import type { TestToken } from '../../typechain/TestToken'
import { PairSim } from '../shared/PairSim'

const { loadFixture, solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Burn', () => {
  const tests = testCases.burn()

  async function fixture(): Promise<{
    pair: Pair
    pairSim: PairSim
    assetToken: TestToken
    collateralToken: TestToken
  }> {
    const assetToken = await testTokenNew('Ether', 'WETH', 10000n)
    const collateralToken = await testTokenNew('Matic', 'MATIC', 10000n)
    const maturity = (await now()) + 31536000n

    const pair = await pairInit(assetToken, collateralToken, maturity)
    const pairSim = new PairSim(maturity)

    return { pair, pairSim, assetToken, collateralToken }
  }

  tests.Success.forEach((test, idx) => {
    describe(`Success case ${idx + 1} for burn`, () => {
      async function fixtureSuccess(): Promise<{
        pair: Pair
        pairSim: PairSim
        assetToken: TestToken
        collateralToken: TestToken
      }> {
        const { pair, pairSim, assetToken, collateralToken } = await loadFixture(fixture)

        const signers = await ethers.getSigners()
        await assetToken.transfer(pair.pairContract.address, 2000n)
        await collateralToken.transfer(pair.pairContract.address, 2000n)

        const txnmint = await pair.upgrade(signers[0]).mint(20n, 20n)

        pairSim.mint(2000n, 2000n, 20n, 20n, await getBlock(txnmint.blockHash!))
        advanceTimeAndBlock(31536000)
        const txn = await pair.upgrade(signers[0]).burn(test.liquidityIn)

        const block = await getBlock(txn.blockHash!)
        const simResult = pairSim.burn(test.liquidityIn, block)
        console.log('Sim result of burn ', simResult)
        return { pair, pairSim, assetToken, collateralToken }
      }

      it('Sample test for burn', async () => {
        const { pair } = await loadFixture(fixtureSuccess)
        const totalLiquidity = await pair.totalLiquidity()
      })
    })
  })

  tests.Failure.forEach((test, idx) => {
    describe(`Failure case ${idx + 1}`, () => {
      async function fixtureFailure(): Promise<{
        pair: Pair
        pairSim: PairSim
        assetToken: TestToken
        collateralToken: TestToken
      }> {
        const { pair, pairSim, assetToken, collateralToken } = await loadFixture(fixture)

        const signers = await ethers.getSigners()
        // pair.upgrade(signers[0]).mint(test.interestIncrease, test.cdpIncrease) //this will revert
        await assetToken.transfer(pair.pairContract.address, 2000n)
        await collateralToken.transfer(pair.pairContract.address, 2000n)

        const txnmint = await pair.upgrade(signers[0]).mint(20n, 20n)
        pairSim.mint(2000n, 2000n, 20n, 20n, await getBlock(txnmint.blockHash!))
        advanceTimeAndBlock(31536000)
        console.log('work')
        // const txn = await pair.upgrade(signers[0]).burn(0n)

        // const block = await getBlock(txn.blockHash!)
        // const simResult = pairSim.burn(0n, block)
        console.log('work')
        // console.log('Sim result of burn in fail', simResult)
        return { pair, pairSim, assetToken, collateralToken }
      }

      it('Sample test for burn', async () => {
        const { pair } = await loadFixture(fixtureFailure)

        const signers = await ethers.getSigners()

        // This is passing, but won't fail for a wrong error message
        // Think it is due to the `await txn.wait()`
        const result = pair.upgrade(signers[0]).burn(0n)
        console.log('working fail')
        await expect(result).to.be.revertedWith(test.errorMessage)

        // await expect(
        //   pair.pairContract.connect(signers[0]).burn(pair.maturity, signers[0].address, signers[0].address, 0n)
        // ).to.be.revertedWith(test.errorMessage)

        const totalLiquidity = await pair.totalLiquidity()
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

    const result = await pair.pairContractCallee.factory()
    expect(result).to.be.properAddress
  })
})
