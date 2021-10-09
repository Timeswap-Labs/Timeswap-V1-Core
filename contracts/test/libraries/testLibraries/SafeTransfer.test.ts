import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { SafeTransferTest } from '../../../../typechain/SafeTransferTest'
import { IERC20 } from '../../../../typechain/IERC20'
import { testTokenNew } from '../../../../test/shared/TestToken'
import { SafeBalanceTest } from '../../../../typechain/SafeBalanceTest'

let signers: SignerWithAddress[]

const { solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Checking SafeTransfer', () => {
  let token: IERC20
  let safeTransferTest: SafeTransferTest
  let safeBalTest: SafeBalanceTest

  let tokenMinted = 1000n
  let tokenTransfer = 600n
  before(async () => {
    signers = await ethers.getSigners()
  })
  beforeEach(async () => {
    token = await testTokenNew('Ether', 'WETH', tokenMinted)
    const safeTransfer = await ethers.getContractFactory('SafeTransferTest')
    safeTransferTest = (await safeTransfer.deploy()) as SafeTransferTest
    await safeTransferTest.deployed()
    const safeBal = await ethers.getContractFactory('SafeBalanceTest')
    safeBalTest = (await safeBal.deploy()) as SafeBalanceTest
    await safeBalTest.deployed()
    token.transfer(safeTransferTest.address, tokenTransfer)
    safeTransferTest.safeTransfer(token.address, safeBalTest.address, tokenTransfer)
  })
  it('Should pass when token is transferred', async () => {
    let safeBalance = await safeBalTest.safeBalance(token.address)
    expect(safeBalance).to.be.equal(tokenTransfer)
  })
  it('Should revert when amount exceeds balance', async () => {
    safeTransferTest.safeTransfer(token.address, safeBalTest.address, tokenTransfer)
    let safeBalance = await safeBalTest.safeBalance(token.address)
    //TODO revert with error string "ERC20: transfer amount exceeds balance"
  })
})
