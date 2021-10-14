import { BigNumberish } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { MintMathTest } from '../../typechain/MintMathTest'
import { now } from '../shared/Helper'

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
  x: 100n,
  y: 100n,
  z: 100n,
}

const stateTest: StateTestParams = {
  asset: 100n,
  interest: 100n,
  cdp: 100n,
}

let MintMathTestContract: MintMathTest
let maturity: BigNumberish;

const assetIn: bigint = 1000n
const interestDecrease: bigint = 30n
const cdpDecrease: bigint = 2n
const fee: bigint = 2n


describe('MintMath', () => {

  before(async () => {
    signers = await ethers.getSigners()
    maturity = await now() + 10000n;
    const MintMathTestContactFactory = await ethers.getContractFactory('MintMathTest')
    MintMathTestContract = (await MintMathTestContactFactory.deploy()) as MintMathTest
    await MintMathTestContract.deployed();
  })

  it('Check should return true', async () => {
    console.log(MintMathTestContract.getLiquidityTotal1();
  })

  

})
