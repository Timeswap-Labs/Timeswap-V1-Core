import { now } from '../shared/Helper'
import helper from '../shared/Helper'

export function getLiquidityTotal1(assetIn: bigint): bigint {
  let liquidityTotal = assetIn
  liquidityTotal <<= 40n
  return liquidityTotal
}

export function getLiquidityTotal2(
  state: {
    asset: bigint
    interest: bigint
    cdp: bigint
  },
  assetIn: bigint,
  interestIncrease: bigint,
  cdpIncrease: bigint,
  total: bigint
): bigint {
  const liquidityTotal = min(
    (total * assetIn) / state.asset,
    (total * interestIncrease) / state.interest,
    (total * cdpIncrease) / state.cdp
  )
  return liquidityTotal
}

export async function getLiquidity(maturity: bigint, liquidityTotal: bigint, protocolFee: number): Promise<bigint> {
  let denominator = maturity
  denominator -= await now()
  denominator *= BigInt(protocolFee)
  denominator += 0x10000000000n
  const liquidityOut = (liquidityTotal * 0x10000000000n) / denominator
  return liquidityOut
}

export function min(w: bigint, x: bigint, y: bigint): bigint {
  if (w <= x && w <= y) {
    return w
  } else if (x <= w && x <= y) {
    return x
  } else {
    return y
  }
}

export async function getDebt(maturity: bigint, assetIn: bigint, interestIncrease: bigint): Promise<bigint> {
  let _debtOut = maturity
  _debtOut -= await now()
  _debtOut *= interestIncrease
  //   _debtOut = _debtOut.shiftUp(32) // TODO!!!
  _debtOut += assetIn
  const debtOut = _debtOut
  return debtOut
}

export async function getCollateral(
  maturity: bigint,
  assetIn: bigint,
  interestIncrease: bigint,
  cdpIncrease: bigint
): Promise<bigint> {
  let _collateralOut = maturity
  _collateralOut -= await now()
  _collateralOut *= interestIncrease
  _collateralOut += assetIn << 32n
  _collateralOut = (_collateralOut * cdpIncrease) / (assetIn << 32n)
  _collateralOut += cdpIncrease
  const collateralOut = _collateralOut
  return collateralOut
}

export default {
  getLiquidityTotal1,
  getLiquidityTotal2,
}
