import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { Address } from 'hardhat-deploy/dist/types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { constants } from 'ethers'
import { SafeBalanceTest } from '../../../../typechain/SafeBalanceTest'

import { IERC20 } from '../../../../typechain/IERC20'
import type { TimeswapPair } from '../../../../typechain/TimeswapPair'
import { IFactory } from '../../../../typechain/IFactory'

import { testTokenNew } from '../../../../test/shared/TestToken'

let signers: SignerWithAddress[]

const { solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Checking SafeBalance', () => {
  let token: IERC20
  let safeBalTest: SafeBalanceTest
  before(async () => {
    signers = await ethers.getSigners()
  })
  beforeEach(async () => {
    token = await testTokenNew('Ether', 'WETH', 1000n)
    const safeBal = await ethers.getContractFactory('SafeBalanceTest')
    safeBalTest = (await safeBal.deploy()) as SafeBalanceTest
    await safeBalTest.deployed()
    //deploy safebalancetest.sol
    //transfer x tokens to above address
  })
  it('Returns safe balance', () => {
    let safeBal = safeBalTest.safeBalance(token.address)
  })
})
