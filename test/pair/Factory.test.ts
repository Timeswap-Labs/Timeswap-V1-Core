import chai from 'chai'
import { ethers,waffle } from 'hardhat'
import { now } from '../shared/Helper'
import { constructorFixture, Fixture } from '../shared/Fixtures'
import { factoryInit } from '../shared/Factory'


const { loadFixture, solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Constructor', () => {

  it("Set Owner should work properly", async()=> {
      const factory = await factoryInit()

      const signers = await ethers.getSigners()
      await factory.connect(signers[10]).setOwner(signers[1].address);
      await factory.connect(signers[1]).acceptOwner();
      const currentOwner = await factory.owner()
      const expectedOwner = signers[1].address
      expect(currentOwner).to.equal(expectedOwner);
  })
})
