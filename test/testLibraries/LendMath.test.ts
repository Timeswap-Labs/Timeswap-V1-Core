import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { LendMathTest } from '../../typechain/LendMathTest'
import LendMath from '../libraries/LendMath'
import { IERC20 } from '../../typechain/IERC20'
import { testTokenNew } from '../shared/TestToken'
import { State } from '../shared/PairInterface'
import { BigNumber } from '@ethersproject/bignumber'

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
interface StateTestParams {
  asset: bigint
  interest: bigint
  cdp: bigint
}
describe('Testing LendMath', () => {
  let lendMathTestContract: LendMathTest
  const state: StateParams = {
    reserves: { asset: 100n, collateral: 100n },
    totalLiquidity: 100n,
    totalClaims: { bond: 100n, insurance: 100n },
    totalDebtCreated: 100n,
    x: 100n,
    y: 100n,
    z: 100n,
  }
  const stateTest: StateTestParams = {
    asset: 100n,
    interest: 100n,
    cdp: 100n,
  }

  const assetIn: bigint = 1000n //randomNumbers
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
    //deploy the contract ; done
    //get random parameters ; done
    //pass parameters to contract and test library
    //compare both
  })
  it('should not revert for check', async () => {
    const txn = await lendMathTestContract.check(state, assetIn, interestDecrease, cdpDecrease, fee)

    let lendMathContract = await lendMathTestContract.check(state, assetIn, interestDecrease, cdpDecrease, fee) // no return value
    console.log(txn, lendMathContract)

    // expect(lendMathTest).to.be.true
    // expect(lendMathTest).to.be.false
  })
})
