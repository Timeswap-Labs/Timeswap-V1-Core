import { BigNumberish } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { CallbackTest } from '../../typechain/CallbackTest'
import { CallbackTestCallee } from '../../typechain/CallbackTestCallee'
import { IERC20 } from '../../typechain/IERC20'
import { expect } from '../shared/Expect'
import { now } from '../shared/Helper'
import { testTokenNew } from '../shared/TestToken'

let signers: SignerWithAddress[]

const { solidity } = waffle
chai.use(solidity)

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

const state: StateParams = {
  reserves: { asset: 0n, collateral: 0n },
  totalLiquidity: 0n,
  totalClaims: { bond: 0n, insurance: 0n },
  totalDebtCreated: 0n,
  x: 5000n,
  y: 10000n,
  z: 10000n,
}

const stateTest: StateTestParams = {
  asset: 5000n,
  interest: 10000n,
  cdp: 10000n,
}

let CallbackTestContract: CallbackTest
let CallbackTestCalleeContract: CallbackTestCallee
let maturity: BigNumberish;
let assetToken: IERC20
let collateralToken: IERC20

const assetIn: bigint = 0n
const collateralIn: bigint = 0n
const interestIncrease: bigint = 30n
const cdpIncrease: bigint = 50n
const fee: bigint = 2n

describe('Borrow Math', () => {

  before(async () => {
    signers = await ethers.getSigners()
    maturity = await now() + 10000n;
    assetToken = await testTokenNew('Ether', 'WETH', 0n)
    collateralToken = await testTokenNew('Matic', 'MATIC', 0n)
    const CallbackTestContractFactory = await ethers.getContractFactory('CallbackTest')
    const CallbackTestCalleeContractFactory = await ethers.getContractFactory('CallbackTestCallee')
    CallbackTestContract = (await CallbackTestContractFactory.deploy()) as CallbackTest
    await CallbackTestContract.deployed()
    CallbackTestCalleeContract = (await CallbackTestCalleeContractFactory.deploy(CallbackTestContract.address)) as CallbackTestCallee
    await CallbackTestCalleeContract.deployed()
  })

  it('Mint Callback should return true', async () => {
    expect(await CallbackTestCalleeContract.callStatic.mint(assetToken.address, collateralToken.address, assetIn, collateralIn, "0x")).to.be.true;
  })

  it('Lend Callback should return true', async () => {
    expect(await CallbackTestCalleeContract.callStatic.lend(assetToken.address, assetIn, "0x")).to.be.true;
  })

  it('Borrow Callback should return true', async () => {
    expect(await CallbackTestCalleeContract.callStatic.borrow(collateralToken.address, collateralIn, "0x")).to.be.true;
  })

  it('Pay Callback should return true', async () => {
    expect(await CallbackTestCalleeContract.callStatic.pay(assetToken.address, assetIn, "0x")).to.be.true;
  })



})
