import { getBlock } from './Helper'
import { Pair, pairInit } from './Pair'
import { PairSim } from './PairSim'
import { testTokenNew } from './TestToken'
import { LendParams, MintParams } from '../pair/TestCases'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import type { TestToken } from '../../typechain/TestToken'
import { adjust, check, readjust } from '../libraries/LendMath'
import { FEE } from './Constants'

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
  const interestAdjust = adjust(lendParams.interestDecrease, pairSim.pool.state.interest, feeBase)
  const cdpAdjust = k / ((pairSim.pool.state.asset + lendParams.assetIn) * interestAdjust)
  const cdpDecrease = readjust(cdpAdjust, pairSim.pool.state.cdp, feeBase)
  console.log('1')
  console.log(cdpDecrease)
  console.log('PairSim state', pairSim.pool.state)

  console.log('Check 1', check(pairSim.pool.state, lendParams.assetIn, lendParams.interestDecrease, cdpDecrease, FEE))
  // console.log(
  //   'Check 2',
  //   check(pairSim.pool.state, lendParams.assetIn, lendParams.interestDecrease, lendParams.cdpDecrease, FEE)
  // )

  const txn = await pair.upgrade(signer).lend(lendParams.interestDecrease, cdpDecrease)

  const block = await getBlock(txn.blockHash!)
  pairSim.lend(lendParams.assetIn, lendParams.interestDecrease, cdpDecrease, block)

  console.log('2')

  return { pair, pairSim, assetToken, collateralToken }
}

export interface Fixture {
  pair: Pair
  pairSim: PairSim
  assetToken: TestToken
  collateralToken: TestToken
}

export default { constructorFixture, mintFixture, lendFixture }
