import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { LendMathTest } from '../../typechain/LendMathTest'
import { IERC20 } from '../../typechain/IERC20'
import { testTokenNew } from '../shared/TestToken'

let signers: SignerWithAddress[]

const { solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Testing LendMath', () => {
  let lendMathTestContract: LendMathTest
  before(async () => {
    signers = await ethers.getSigners()
  })
  beforeEach(async () => {
    const LendMathTestContactFactory = await ethers.getContractFactory('LendMathTest')
    lendMathTestContract = (await LendMathTestContactFactory.deploy()) as LendMathTest
    await lendMathTestContract.deployed()
    //deploy the contract ; done
    //get random parameters
    //pass parameters to contract and test library
    //compare both
  })
})
