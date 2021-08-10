import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
import { Pair, pairInit } from '../shared/Pair'
import { testTokenNew } from '../shared/TestToken'
import testCases from './TestCases'

import type { TestToken } from '../../typechain/TestToken'

const { loadFixture, solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Mint', () => {
  const tests = testCases.mint()

  async function fixture(): Promise<{
    pair: Pair
    assetToken: TestToken
    collateralToken: TestToken
  }> {
    const assetToken = await testTokenNew('Ether', 'WETH', 10000n)
    const collateralToken = await testTokenNew('Matic', 'MATIC', 10000n)
    const maturity = (await now()) + 31536000n

    const pair = await pairInit(assetToken, collateralToken, maturity)

    return { pair, assetToken, collateralToken }
  }

  tests.Success.forEach((test, idx) => {
    describe(`Success case ${idx + 1}`, () => {
      async function fixtureSuccess(): Promise<{
        pair: Pair
        assetToken: TestToken
        collateralToken: TestToken
      }> {
        const { pair, assetToken, collateralToken } = await loadFixture(fixture)

        const signers = await ethers.getSigners()
        pair.upgrade(signers[0]).mint(test.interestIncrease, test.cdpIncrease)

        return { pair, assetToken, collateralToken }
      }

      it('Sample test', async () => {
        const { pair } = await loadFixture(fixture)

        const totalLiquidity = await pair.totalLiquidity()
      })
    })
  })

  tests.Failure.forEach((test, idx) => {
    describe(`Failure case ${idx + 1}`, () => {
      async function fixtureFailure(): Promise<{
        pair: Pair
        assetToken: TestToken
        collateralToken: TestToken
      }> {
        const { pair, assetToken, collateralToken } = await loadFixture(fixture)

        const signers = await ethers.getSigners()
        pair.upgrade(signers[0]).mint(test.interestIncrease, test.cdpIncrease)

        return { pair, assetToken, collateralToken }
      }

      it('Sample test', async () => {
        const { pair } = await loadFixture(fixture)

        const totalLiquidity = await pair.totalLiquidity()
      })
    })
  })

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
