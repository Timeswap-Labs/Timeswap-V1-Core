import chai from 'chai'
import { BigNumber } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { SafeCastTest } from '../../typechain/SafeCastTest'
import { expect } from '../shared/Expect'

const { solidity } = waffle
chai.use(solidity)

let safeCastTestContract: SafeCastTest
const MaxUint111 = BigNumber.from(2).pow(111).sub(1)
const MaxUint112 = BigNumber.from(2).pow(112).sub(1)
const MaxUint113 = BigNumber.from(2).pow(113).sub(1)
const MaxUint128 = BigNumber.from(2).pow(128).sub(1)
const MaxUint256 = BigNumber.from(2).pow(256).sub(1)

describe('safeCast', () => {
  beforeEach(async () => {
    const safeCastTestContactFactory = await ethers.getContractFactory('SafeCastTest')
    safeCastTestContract = (await safeCastTestContactFactory.deploy()) as SafeCastTest
    await safeCastTestContract.deployed()
  })

  it('should return uint112', async () => {
    let returnValue1 = await safeCastTestContract.toUint112(MaxUint112)
    expect(returnValue1).to.be.equal(MaxUint112)
  })
  it('should return uint128', async () => {
    let returnValue1 = await safeCastTestContract.toUint128(MaxUint128)
    expect(returnValue1).to.be.equal(MaxUint128)
  })
  it('should truncate to Uint112', async () => {
    expect(await safeCastTestContract.truncateUint112(MaxUint113)).to.be.equal(MaxUint112)
    expect(await safeCastTestContract.truncateUint112(MaxUint111)).to.be.equal(MaxUint111)
  })
})
