import { doesNotMatch } from 'assert'
import { checkConstantProduct } from '../libraries/ConstantProduct'
import { divUp, shiftRightUp } from '../libraries/Math'
export function getFees(maturity: bigint, assetOut: bigint, fee: bigint, protocolFee: bigint, now: bigint) {
  let totalFee = fee + protocolFee

  let denominator = (maturity - now) * totalFee
  denominator = denominator + 0x10000000000n

  let adjusted = assetOut
  adjusted = adjusted * 0x10000000000n
  adjusted = adjusted / denominator

  let totalFeeStoredIncrease = assetOut - adjusted
  let feeStoredIncrease = totalFeeStoredIncrease
  feeStoredIncrease = feeStoredIncrease * fee
  feeStoredIncrease = feeStoredIncrease / totalFee
  let protocolFeeStoredIncrease = totalFeeStoredIncrease - feeStoredIncrease

  return {
    feeStoredIncrease: feeStoredIncrease,
    protocolFeeStoredIncrease: protocolFeeStoredIncrease,
  }
}

export function check(
  state: {
    asset: bigint
    interest: bigint
    cdp: bigint
  },
  assetOut: bigint,
  interestIncrease: bigint,
  cdpIncrease: bigint
): boolean | string {
  const xReserve = state.asset - assetOut
  const yReserve = state.interest + interestIncrease
  const zReserve = state.cdp + cdpIncrease
  if (!checkConstantProduct(state, xReserve, yReserve, zReserve)) return 'E301'

  let yMax = assetOut
  yMax *= state.interest
  yMax = divUp(yMax, xReserve)
  if (interestIncrease > yMax) return 'E214'

  let zMax = assetOut
  zMax *= state.cdp
  zMax = divUp(zMax, xReserve)
  if (cdpIncrease > zMax) return 'E215'

  let yMin = yMax
  yMin *= shiftRightUp(yMin,4n)
  if (interestIncrease >= yMin) return 'E217'

  return true
}

export function adjust(increase: bigint, reserve: bigint, feeBase: bigint): bigint {
  let adjusted = reserve
  adjusted <<= 16n
  adjusted += feeBase * increase
  return adjusted
}

export function readjust(adjusted: bigint, reserve: bigint, feeBase: bigint): bigint {
  let increase = adjusted
  increase -= reserve << 16n
  increase = divUp(increase, feeBase)
  return increase
}

export function getDebt(maturity: bigint, assetOut: bigint, interestIncrease: bigint, now: bigint): bigint {
  let _debtOut = maturity
  _debtOut -= now
  _debtOut *= interestIncrease
  _debtOut = shiftRightUp(_debtOut, 32n)
  _debtOut += assetOut
  return _debtOut
}

export function getCollateral(
  maturity: bigint,
  state: {
    asset: bigint
    interest: bigint
    cdp: bigint
  },
  assetOut: bigint,
  cdpIncrease: bigint,
  now: bigint
): bigint {
  let _collateralIn = maturity
  _collateralIn -= now
  _collateralIn *= cdpIncrease
  _collateralIn = shiftRightUp(_collateralIn, 25n)
  let minimum = state.cdp
  minimum *= assetOut
  let denominator = state.asset
  denominator -= assetOut
  minimum = divUp(minimum, denominator)
  _collateralIn += minimum
  return _collateralIn
}

export default {
  getFees,
  check,
  adjust,
  readjust,
  getDebt,
  getCollateral,
}
