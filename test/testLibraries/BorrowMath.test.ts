import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { BorrowMathTest } from '../../typechain/BorrowMathTest'

let signers: SignerWithAddress[]

const { solidity } = waffle
chai.use(solidity)
const { expect } = chai

interface StateParams {
  asset: bigint
  interest: bigint
  cdp: bigint
}

describe('Testing BorrowMath', () => {
  let borrowMathTestContract: BorrowMathTest
  const state: StateParams = {
    asset: 100n,
    interest: 3n,
    cdp: 2n,
  }
  const assetIn: bigint = 1000n //randomNumbers
  const interestDecrease: bigint = 3n
  const cdpDecrease: bigint = 2n
  const fee: bigint = 2n

  before(async () => {
    signers = await ethers.getSigners()
  })
  beforeEach(async () => {
    const BorrowMathTestContactFactory = await ethers.getContractFactory('BorrowMathTest')
    borrowMathTestContract = (await BorrowMathTestContactFactory.deploy()) as BorrowMathTest
    await borrowMathTestContract.deployed()

  })
  it('should not revert for check', () => {
    // need to get correct state parameter
    borrowMathTestContract.check(state, assetIn, interestDecrease, cdpDecrease, fee)
  })
})
