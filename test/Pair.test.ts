import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import { Pair, pairInit } from './shared/Pair'
import { testTokenNew } from './shared/TestToken'

chai.use(solidity)
const { expect } = chai

describe('Test Cases', () => {
  let pair: Pair

  before(async () => {
    const asset = await testTokenNew(10000n)
    const collateral = await testTokenNew(10000n)
    const maturity = 31536000n

    pair = await pairInit(asset, collateral, maturity)
  })

  it('Test Case 1', async () => {
    console.log('Liquidity ', await pair.totalLiquidity())

    const signers = await ethers.getSigners()
    await pair.upgrade(signers[0]).mint(10n, 10n)

    expect(2).to.equal(2)
  })
})
