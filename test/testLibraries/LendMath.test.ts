import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { LendMathTest } from '../../typechain/LendMathTest'
import { IERC20 } from '../../typechain/IERC20'
import { testTokenNew } from '../shared/TestToken'
import { State } from '../shared/PairInterface'

let signers: SignerWithAddress[]

const { solidity } = waffle
chai.use(solidity)
const { expect } = chai
interface StateParams {
  asset: bigint
  interest: bigint
  cdp: bigint
}
describe('Testing LendMath', () => {
  let lendMathTestContract: LendMathTest
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
    const LendMathTestContactFactory = await ethers.getContractFactory('LendMathTest')
    lendMathTestContract = (await LendMathTestContactFactory.deploy()) as LendMathTest
    await lendMathTestContract.deployed()
    //deploy the contract ; done
    //get random parameters ; done
    //pass parameters to contract and test library
    //compare both
  })
  it('should not revert for check', () => {
    // need to get correct state parameter
    lendMathTestContract.check(state, assetIn, interestDecrease, cdpDecrease, fee)
  })
})
