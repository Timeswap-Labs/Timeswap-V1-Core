import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { SafeTransferTest } from '../../typechain/SafeTransferTest'
import { IERC20 } from '../../typechain/IERC20'
import { testTokenNew } from '../shared/TestToken'
import { SafeBalanceTest } from '../../typechain/SafeBalanceTest'

let signers: SignerWithAddress[]

const { solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Checking SafeTransfer', () => {
  let token: IERC20
  let safeTransferTestContract: SafeTransferTest
  let safeBalTestContract: SafeBalanceTest

  let tokenMinted = 1000n // randomNumbers
  let tokenTransfer = 600n // randomNumbers; but should be less than the token minted
  before(async () => {
    signers = await ethers.getSigners()
  })
  beforeEach(async () => {
    token = await testTokenNew('Ether', 'WETH', tokenMinted)
    const SafeTransferFactory = await ethers.getContractFactory('SafeTransferTest')
    safeTransferTestContract = (await SafeTransferFactory.deploy()) as SafeTransferTest
    await safeTransferTestContract.deployed()
    const SafeBalanceTestContactFactory = await ethers.getContractFactory('SafeBalanceTest')
    safeBalTestContract = (await SafeBalanceTestContactFactory.deploy()) as SafeBalanceTest
    await safeBalTestContract.deployed()
    token.transfer(safeTransferTestContract.address, tokenTransfer)
    safeTransferTestContract.safeTransfer(token.address, safeBalTestContract.address, tokenTransfer)
  })
  it('Should pass when token is transferred', async () => {
    let safeBalance = await safeBalTestContract.safeBalance(token.address)
    expect(safeBalance).to.be.equal(tokenTransfer)
  })
  it('Should revert when amount exceeds balance', async () => {
    expect(
      safeTransferTestContract.safeTransfer(token.address, safeBalTestContract.address, tokenTransfer)
    ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
  })
})
