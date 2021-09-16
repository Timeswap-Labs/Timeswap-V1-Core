import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import { now } from './shared/Helper'
import { Pair, pairInit } from './shared/Pair'
import { testTokenNew } from './shared/TestToken'

import type { TestToken } from '../typechain/TestToken'

chai.use(solidity)
// chai.use((chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) => {
//   const assertion = chai.Assertion

//   assertion.addMethod()
// })

const { expect } = chai

describe('Test Cases', () => {
  let pair: Pair
  let assetToken: TestToken
  let collateralToken: TestToken

  before(async () => {
    assetToken = await testTokenNew('Ether', 'WETH', 10000n)
    collateralToken = await testTokenNew('Matic', 'MATIC', 10000n)
    const maturity = (await now()) + 31536000n

    pair = await pairInit(assetToken, collateralToken, maturity)
  })

  it('Test Case 1', async () => {
    console.log('Liquidity ', await pair.totalLiquidity())

    // expect(assetToken.balanceOf())

    const signers = await ethers.getSigners()

    await assetToken.transfer(pair.pairContractCallee.address, 2000n)
    await collateralToken.transfer(pair.pairContractCallee.address, 2000n)

    await pair.upgrade(signers[0]).mint(10n, 10n, 10n)

    // expect(2n).to.equal(3n)
  })
})
