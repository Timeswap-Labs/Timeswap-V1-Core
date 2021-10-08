import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { SafeBalanceTest } from '../../../../typechain/SafeBalanceTest'
import { IERC20 } from '../../../../typechain/IERC20'
import { testTokenNew } from '../../../../test/shared/TestToken'

let signers: SignerWithAddress[]

const { solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Checking SafeBalance', () => {
  let token: IERC20
  let safeBalTest: SafeBalanceTest
  let tokenMinted = 1000n
  let tokenTransfer = 600n
  before(async () => {
    signers = await ethers.getSigners()
  })
  beforeEach(async () => {
    token = await testTokenNew('Ether', 'WETH', tokenMinted)
    const safeBal = await ethers.getContractFactory('SafeBalanceTest')
    safeBalTest = (await safeBal.deploy()) as SafeBalanceTest
    await safeBalTest.deployed()
    token.transfer(safeBalTest.address, tokenTransfer)
  })
  it('Should return the balance transferred', async () => {
    let safeBalance = await safeBalTest.safeBalance(token.address)
    expect(safeBalance).to.be.equal(tokenTransfer)
  })
})
