import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { getBlock, now } from '../shared/Helper'
import { Pair, pairInit } from '../shared/Pair'
import { testTokenNew } from '../shared/TestToken'
import testCases from './TestCases'

import type { TestToken } from '../../typechain/TestToken'
import { getLiquidityTotal1 } from '../libraries/MintMath'
import { PairSim } from '../shared/PairSim'

const { loadFixture, solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Mint', () => {
  const tests = testCases.mint()

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
    describe(`Success case ${idx + 1}`, () => {
      async function fixtureSuccess(): Promise<{
        pair: Pair
        pairSim: PairSim
        assetToken: TestToken
        collateralToken: TestToken
      }> {
        const { pair, pairSim, assetToken, collateralToken } = await loadFixture(fixture)

        const signers = await ethers.getSigners()

        await assetToken.transfer(pair.pairContract.address, test.assetIn)
        await collateralToken.transfer(pair.pairContract.address, test.collateralIn)

        const txn = await pair.upgrade(signers[0]).mint(test.interestIncrease, test.cdpIncrease)
        console.log('Transaction ', txn)

        const block = await getBlock(txn.blockHash!)
        console.log('Block ', block)

        const simResult = pairSim.mint(test.assetIn, test.collateralIn, test.interestIncrease, test.cdpIncrease, block)
        console.log('Sim result ', simResult)
        console.log('Sim pool ', pairSim.pool)

        const atl = await pair.totalLiquidity()
        console.log('Actual total liquidity ', atl)
        const alo = await pair.liquidityOf(signers[0])
        console.log('Actual liquidity of ', alo)

        return { pair, pairSim, assetToken, collateralToken }
      }

      it('Sample test', async () => {
        const { pair } = await loadFixture(fixtureSuccess)

        // console.log('', pair.pairContract.)

        const totalLiquidity = await pair.totalLiquidity()
      })
    })
  })

  // tests.Failure.forEach((test, idx) => {
  //   describe(`Failure case ${idx + 1}`, () => {
  //     async function fixtureFailure(): Promise<{
  //       pair: Pair
  //       assetToken: TestToken
  //       collateralToken: TestToken
  //     }> {
  //       const { pair, assetToken, collateralToken } = await loadFixture(fixture)

  //       const signers = await ethers.getSigners()
  //       // pair.upgrade(signers[0]).mint(test.interestIncrease, test.cdpIncrease) //this will revert

  //       return { pair, assetToken, collateralToken }
  //     }

  //     it('Sample test', async () => {
  //       const { pair } = await loadFixture(fixture)

  //       const signers = await ethers.getSigners()

  //       // This is passing, but won't fail for a wrong error message
  //       // Think it is due to the `await txn.wait()`
  //       // const result = pair.upgrade(signers[0]).mint(test.interestIncrease, test.cdpIncrease)
  //       // await expect(result).to.be.revertedWith(test.errorMessage)

  //       await expect(
  //         pair.pairContract
  //           .connect(signers[0])
  //           .mint(pair.maturity, signers[0].address, signers[0].address, test.interestIncrease, test.cdpIncrease)
  //       ).to.be.revertedWith(test.errorMessage)

  //       const totalLiquidity = await pair.totalLiquidity()
  //     })
  //   })
  // })

  it('Should be a proper address', async () => {
    const { pair } = await loadFixture(fixture)
    expect(pair.pairContract.address).to.be.properAddress
  })

  it('Should have proper factory address', async () => {
    const { pair } = await loadFixture(fixture)

    const result = await pair.pairContract.factory()
    expect(result).to.be.properAddress
  })
})
