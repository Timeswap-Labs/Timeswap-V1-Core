import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { now } from '../shared/Helper'
import { Pair, pairInit } from '../shared/Pair'
import { testTokenNew } from '../shared/TestToken'

import type { TestToken } from '../../typechain/TestToken'

chai.use(solidity)
const { expect } = chai

describe('Constructor', () => {
  let pair: Pair
  let assetToken: TestToken
  let collateralToken: TestToken

  before(async () => {
    assetToken = await testTokenNew('Ether', 'WETH', 10000n)
    collateralToken = await testTokenNew('Matic', 'MATIC', 10000n)
    const maturity = (await now()) + 31536000n

    pair = await pairInit(assetToken, collateralToken, maturity)
  })

  it('Should be a proper address', () => {
    expect(pair.pairContract.address).to.be.properAddress
  })

  it('Should have proper factory address', async () => {
    const result = await pair.pairContract.factory()
    expect(result).to.be.properAddress
  })
})
