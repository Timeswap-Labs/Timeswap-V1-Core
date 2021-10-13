import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { LendMathTest } from '../../typechain/LendMathTest'

let signers: SignerWithAddress[]

const { solidity } = waffle
chai.use(solidity)
const { expect } = chai

interface Token {
  asset: bigint
  collateral: bigint
}
interface Claims {
  bond: bigint
  insurance: bigint
}
interface StateParams {
  reserves: Token
  totalLiquidity: bigint
  totalClaims: Claims
  totalDebtCreated: bigint
  x: bigint
  y: bigint
  z: bigint
}

let lendMathTestContract: LendMathTest
  const state: StateParams = {
    reserves: { asset: 0n, collateral: 0n },
    totalLiquidity: 0n,
    totalClaims: { bond: 0n, insurance: 0n },
    totalDebtCreated: 0n,
    x: 100n,
    y: 100n,
    z: 100n,
  }

describe('LendMath should succeed', () => {
  

  const assetIn: bigint = 1000n
  const interestDecrease: bigint = 30n
  const cdpDecrease: bigint = 2n
  const fee: bigint = 2n

  before(async () => {
    signers = await ethers.getSigners()
  })
  beforeEach(async () => {
    const LendMathTestContactFactory = await ethers.getContractFactory('LendMathTest')
    lendMathTestContract = (await LendMathTestContactFactory.deploy()) as LendMathTest
    await lendMathTestContract.deployed()

  })
  it('should not revert for check', async () => {
    const txn = await lendMathTestContract.check(state, assetIn, interestDecrease, cdpDecrease, fee)
    let lendMathContract = await lendMathTestContract.check(state, assetIn, interestDecrease, cdpDecrease, fee);
    expect(txn).to.be.true;
    expect(lendMathContract).to.be.true;
    expect(txn).to.equal(lendMathContract);
  })
})

describe('LendMath should fail', () => {
  const assetIn: bigint = 1000n
  const interestDecrease: bigint = 3n
  const cdpDecrease: bigint = 2n
  const fee: bigint = 2n

  before(async () => {
    signers = await ethers.getSigners()
  })
  beforeEach(async () => {
    const LendMathTestContactFactory = await ethers.getContractFactory('LendMathTest')
    lendMathTestContract = (await LendMathTestContactFactory.deploy()) as LendMathTest
    await lendMathTestContract.deployed();
  })
  it('should revert with ', async () => {
    await expect(lendMathTestContract.check(state, assetIn, interestDecrease, cdpDecrease, fee)).to.be.revertedWith("Minimum");
  })
})
