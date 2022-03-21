import { BigNumber } from '@ethersproject/bignumber'
import { now, pseudoRandomBigUint } from '../shared/Helper'

const MaxUint112 = BigNumber.from(2).pow(112).sub(1)

const count = 10
export interface MintParams {
  assetIn: bigint
  collateralIn: bigint
  interestIncrease: bigint
  cdpIncrease: bigint
  maturity: bigint
  currentTimeStamp: bigint
}

export async function mint(): Promise<MintParams[]> {
  const testCases = await mintTestCases()
  return testCases
}

export async function mintTestCases(): Promise<MintParams[]> {
  const nt = await now()
  const testcases = Array(count)
    .fill(null)
    .map(() => {
      return {
        assetIn: pseudoRandomBigUint(MaxUint112),
        collateralIn: pseudoRandomBigUint(MaxUint112),
        interestIncrease: pseudoRandomBigUint(MaxUint112),
        cdpIncrease: pseudoRandomBigUint(MaxUint112),
        maturity: nt + 31556952n,
        currentTimeStamp: nt,
      }
    })
  return testcases
}
