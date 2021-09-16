import chai from 'chai'
import { waffle } from 'hardhat'
import { now } from '../shared/Helper'
import { constructorFixture, Fixture } from '../shared/Fixtures'

const { loadFixture, solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Constructor', () => {
  async function fixture(): Promise<Fixture> {
    const constructor = await constructorFixture(10000n, 10000n, (await now()) + 31536000n)
    return constructor
  }

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
