import { getBlock } from './Helper'
import { Pair, pairInit } from './Pair'
import { PairSim } from './PairSim'
import { testTokenNew } from './TestToken'
import { BorrowParams, LendParams, MintParams } from '../pair/TestCases'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import LendMath from '../libraries/LendMath'
import BorrowMath from '../libraries/BorrowMath'
import { FEE } from './Constants'

import type { TestToken } from '../../typechain/TestToken'

export async function constructorFixture(
  assetValue: bigint,
  collateralValue: bigint,
  maturity: bigint
): Promise<Fixture> {
  const assetToken = await testTokenNew('Ether', 'WETH', assetValue)
  const collateralToken = await testTokenNew('Matic', 'MATIC', collateralValue)

  const pair = await pairInit(assetToken, collateralToken, maturity)
  const pairSim = new PairSim(maturity)

  return { pair, pairSim, assetToken, collateralToken }
}

export async function mintFixture(
  fixture: Fixture,
  signer: SignerWithAddress,
  mintParams: MintParams
): Promise<Fixture> {
  const { pair, pairSim, assetToken, collateralToken } = fixture

  await assetToken.transfer(pair.pairContract.address, mintParams.assetIn)
  await collateralToken.transfer(pair.pairContract.address, mintParams.collateralIn)

  const txn = await pair.upgrade(signer).mint(mintParams.interestIncrease, mintParams.cdpIncrease)

  const block = await getBlock(txn.blockHash!)
  pairSim.mint(mintParams.assetIn, mintParams.collateralIn, mintParams.interestIncrease, mintParams.cdpIncrease, block)

  return { pair, pairSim, assetToken, collateralToken }
}

export async function lendFixture(
  fixture: Fixture,
  signer: SignerWithAddress,
  lendParams: LendParams
): Promise<Fixture> {
  const { pair, pairSim, assetToken, collateralToken } = fixture

  await assetToken.transfer(pair.pairContract.address, lendParams.assetIn)

  const k = (pairSim.pool.state.asset * pairSim.pool.state.interest * pairSim.pool.state.cdp) << 32n
  const feeBase = 0x10000n + FEE
  const interestAdjust = LendMath.adjust(lendParams.interestDecrease, pairSim.pool.state.interest, feeBase)
  const cdpAdjust = k / ((pairSim.pool.state.asset + lendParams.assetIn) * interestAdjust)
  const cdpDecrease = LendMath.readjust(cdpAdjust, pairSim.pool.state.cdp, feeBase)

  const txn = await pair.upgrade(signer).lend(lendParams.interestDecrease, cdpDecrease)

  const block = await getBlock(txn.blockHash!)
  pairSim.lend(lendParams.assetIn, lendParams.interestDecrease, cdpDecrease, block)

  return { pair, pairSim, assetToken, collateralToken }
}

export async function borrowFixture(
  fixture: Fixture,
  signer: SignerWithAddress,
  borrowParams: BorrowParams
): Promise<Fixture> {
  const { pair, pairSim, assetToken, collateralToken } = fixture

  await collateralToken.transfer(pair.pairContract.address, borrowParams.collateralIn)

  const k = (pairSim.pool.state.asset * pairSim.pool.state.interest * pairSim.pool.state.cdp) << 32n
  const feeBase = 0x10000n - FEE
  const interestAdjust = BorrowMath.adjust(borrowParams.interestIncrease, pairSim.pool.state.interest, feeBase)
  const cdpAdjust = k / ((pairSim.pool.state.asset - borrowParams.assetOut) * interestAdjust)
  const cdpIncrease = BorrowMath.readjust(cdpAdjust, pairSim.pool.state.cdp, feeBase)

  const txn = await pair.upgrade(signer).borrow(borrowParams.assetOut, borrowParams.interestIncrease, cdpIncrease)

  const block = await getBlock(txn.blockHash!)
  pairSim.borrow(borrowParams.assetOut, borrowParams.collateralIn, borrowParams.interestIncrease, cdpIncrease, block)

  return { pair, pairSim, assetToken, collateralToken }
}

export async function payFixture(
  fixture: Fixture,
  signer: SignerWithAddress,
  borrowParams: BorrowParams
): Promise<Fixture> {
  const { pair, pairSim, assetToken, collateralToken } = fixture

  await collateralToken.transfer(pair.pairContract.address, borrowParams.collateralIn)

  const k = (pairSim.pool.state.asset * pairSim.pool.state.interest * pairSim.pool.state.cdp) << 32n
  const feeBase = 0x10000n - FEE
  const interestAdjust = BorrowMath.adjust(borrowParams.interestIncrease, pairSim.pool.state.interest, feeBase)
  const cdpAdjust = k / ((pairSim.pool.state.asset - borrowParams.assetOut) * interestAdjust)
  const cdpIncrease = BorrowMath.readjust(cdpAdjust, pairSim.pool.state.cdp, feeBase)

  const txn = await pair.upgrade(signer).borrow(borrowParams.assetOut, borrowParams.interestIncrease, cdpIncrease)

  const block = await getBlock(txn.blockHash!)
  pairSim.borrow(borrowParams.assetOut, borrowParams.collateralIn, borrowParams.interestIncrease, cdpIncrease, block)

  return { pair, pairSim, assetToken, collateralToken }
}

export interface Fixture {
  pair: Pair
  pairSim: PairSim
  assetToken: TestToken
  collateralToken: TestToken
}

export default { constructorFixture, mintFixture, lendFixture, borrowFixture, payFixture }
