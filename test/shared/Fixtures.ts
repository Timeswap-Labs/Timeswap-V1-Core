import { ethers } from 'hardhat'
import { advanceTimeAndBlock, getBlock } from './Helper'
import { Pair, pairInit } from './Pair'
import { PairSim } from './PairSim'
import { testTokenNew } from './TestToken'
import { LendParams, BorrowParams, MintParams, BurnParams, WithdrawParams, PayParams } from '../testCases/TestCases'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import LendMath from '../libraries/LendMath'
import BorrowMath from '../libraries/BorrowMath'
import MintMath from '../libraries/MintMath'
import { FEE, PROTOCOL_FEE } from './Constants'
import { now } from '../shared/Helper'
import type { TimeswapFactory as Factory } from '../../typechain/TimeswapFactory'

import type { TestToken } from '../../typechain/TestToken'


export async function constructorFixture(
  assetValue: bigint,
  collateralValue: bigint,
  maturity: bigint
): Promise<Fixture> {
  const signers = await ethers.getSigners();
  const assetToken = await testTokenNew('Ether', 'WETH', assetValue)
  const collateralToken = await testTokenNew('Matic', 'MATIC', collateralValue)

  const pair = await pairInit(assetToken, collateralToken, maturity)
  const factory = pair.factoryContract
  const factoryAddress =  factory.address
  
  const owner = await factory.owner()

  // call the approve function in the test Tokens
  for (let i=1;i<6;i++) {
    await assetToken.transfer(signers[i].address,200n);
    await collateralToken.transfer(signers[i].address,200n);
    
    await assetToken.connect(signers[i]).approve(pair.pairContractCallee.address, 200n);
    await collateralToken.connect(signers[i]).approve(pair.pairContractCallee.address, 200n);
  }

  await assetToken.approve(pair.pairContractCallee.address, assetValue);
  await collateralToken.approve(pair.pairContractCallee.address, collateralValue);
  
  const pairSim = new PairSim(assetToken.address,collateralToken.address,FEE,PROTOCOL_FEE,pair.pairContract.address,factoryAddress,owner)

  return { pair, pairSim, assetToken, collateralToken }
}

export async function mintFixture(
  fixture: Fixture,
  signer: SignerWithAddress,
  mintParams: MintParams
): Promise<Fixture> {
  const { pair, pairSim, assetToken, collateralToken } = fixture

  await assetToken.connect(signer).transfer(pair.pairContractCallee.address, mintParams.assetIn)
  await collateralToken.connect(signer).transfer(pair.pairContractCallee.address, mintParams.collateralIn)
  
  // const collateralIn = MintMath.getCollateral(pair.maturity, mintParams.assetIn, mintParams.interestIncrease, mintParams.cdpIncrease, (await now()));
  // const liquidityTotal = MintMath.getLiquidityTotal1(mintParams.assetIn)
  // const liquidity = MintMath.getLiquidity(pair.maturity, liquidityTotal, PROTOCOL_FEE, (await now()));

  const txn = await pair.upgrade(signer).mint(mintParams.assetIn, mintParams.interestIncrease, mintParams.cdpIncrease)
  
  const block = await getBlock(txn.blockHash!)
  pairSim.mint(pair.maturity,signer.address,signer.address,mintParams.assetIn, mintParams.interestIncrease, mintParams.cdpIncrease, block)

  return { pair, pairSim, assetToken, collateralToken }
}

export async function lendFixture(
  fixture: Fixture,
  signer: SignerWithAddress,
  lendParams: LendParams
): Promise<Fixture> {
  const { pair, pairSim, assetToken, collateralToken } = fixture

  await assetToken.connect(signer).transfer(pair.pairContractCallee.address, lendParams.assetIn)

  //TODO: we must lend after using the Math
  const cp_pairContact = await pair.state();
  const k_pairContract = (cp_pairContact.asset * cp_pairContact.interest * cp_pairContact.cdp) << 32n;
  const cp_pairSimContact = await pairSim.state();
  const k_pairSim = (pairSim.pool.state.asset * pairSim.pool.state.interest * pairSim.pool.state.cdp) << 32n
  // const feeBase = 0x10000n + FEE
  // const interestAdjust = LendMath.adjust(lendParams.interestDecrease, pairSim.pool.state.interest, feeBase)
  // const cdpAdjust = k / ((pairSim.pool.state.asset + lendParams.assetIn) * interestAdjust)
  // const cdpDecrease = LendMath.readjust(cdpAdjust, pairSim.pool.state.cdp, feeBase)

  const txn = await pair.upgrade(signer).lend(lendParams.assetIn, lendParams.interestDecrease, lendParams.cdpDecrease)

  const block = await getBlock(txn.blockHash!)
  pairSim.lend(pair.maturity,signer.address,signer.address,lendParams.assetIn, lendParams.interestDecrease, lendParams.cdpDecrease, block)

  return { pair, pairSim, assetToken, collateralToken }
}

export async function burnFixture(
  fixture: Fixture,
  signer: SignerWithAddress,
  burnParams: BurnParams
): Promise<Fixture> {
  const { pair, pairSim, assetToken, collateralToken } = fixture

  const txnBurn = await pair.upgrade(signer).burn(burnParams.liquidityIn)
  const block = await getBlock(txnBurn.blockHash!)
  pairSim.burn(pair.maturity,signer.address,signer.address,burnParams.liquidityIn,signer.address, block)

  return { pair, pairSim, assetToken, collateralToken }
}



export async function borrowFixture(
  fixture: Fixture,
  signer: SignerWithAddress,
  borrowParams: BorrowParams,
  owner= false
): Promise<Fixture> {
  const { pair, pairSim, assetToken, collateralToken } = fixture
  await collateralToken.transfer(pair.pairContractCallee.address, borrowParams.collateralIn)

  const pool = pairSim.getPool(pair.maturity)
  const state = pool.state
  const k = (state.asset * state.interest * state.cdp) << 32n
  const feeBase = 0x10000n - FEE
  const interestAdjust = BorrowMath.adjust(borrowParams.interestIncrease, state.interest, feeBase)
  const cdpAdjust = k / ((state.asset - borrowParams.assetOut) * interestAdjust)
  const cdpIncrease = BorrowMath.readjust(cdpAdjust, state.cdp, feeBase)
  const txn = await pair.upgrade(signer).borrow(borrowParams.assetOut, borrowParams.interestIncrease, cdpIncrease, owner)

  const block = await getBlock(txn.blockHash!)
  pairSim.borrow(pair.maturity,signer.address,signer.address,borrowParams.assetOut, borrowParams.interestIncrease, cdpIncrease, block)

  return { pair, pairSim, assetToken, collateralToken }
}

export async function payFixture(
  fixture: Fixture,
  signer: SignerWithAddress,
  payParams: PayParams
): Promise<Fixture> {
  const { pair, pairSim, assetToken, collateralToken } = fixture
  const txn = await pair.upgrade(signer).pay(payParams.ids, payParams.debtIn, payParams.collateralOut);

  const block = await getBlock(txn.blockHash!)
  pairSim.pay(pair.maturity,signer.address,signer.address,payParams.ids, payParams.debtIn, payParams.collateralOut,signer.address, block)

  return { pair, pairSim, assetToken, collateralToken }
}

export async function withdrawFixture(
  fixture: Fixture,
  signer: SignerWithAddress,
  mintParams: MintParams,
  burnParams: BurnParams,
  withdrawParams: WithdrawParams
): Promise<Fixture> {
  const { pair, pairSim, assetToken, collateralToken } = fixture

  const txnWithdraw = await pair
    .upgrade(signer)
    .withdraw(withdrawParams.claimsIn.bond, withdrawParams.claimsIn.insurance)
  const blockWithdraw = await getBlock(txnWithdraw.blockHash!)

  pairSim.withdraw(pair.maturity,signer.address,signer.address,withdrawParams.claimsIn,signer.address, blockWithdraw)

  return { pair, pairSim, assetToken, collateralToken }
}



export interface Fixture {
  pair: Pair
  pairSim: PairSim
  assetToken: TestToken
  collateralToken: TestToken
}

export default { constructorFixture, mintFixture}
