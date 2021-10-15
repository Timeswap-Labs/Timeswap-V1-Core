import { mulDiv } from '../libraries/FullMath'
import { State } from '../shared/PairInterface'

export function getAsset(state: State, bondIn: bigint): bigint {
  let assetReserve = state.reserves.asset
  if (assetReserve >= state.totalClaims.bond) return bondIn
  let _assetOut = bondIn
  _assetOut *= assetReserve
  _assetOut /= state.totalClaims.bond
  return _assetOut
}

export function getCollateral(state: State, insuranceIn: bigint): bigint {
  let assetReserve = state.reserves.asset
  if (assetReserve >= state.totalClaims.bond) return 0n
  let _collateralOut = state.totalClaims.bond
  _collateralOut -= assetReserve
  _collateralOut *= state.totalClaims.insurance
  if (state.reserves.collateral * state.totalClaims.bond >= _collateralOut) return insuranceIn
  _collateralOut = mulDiv(_collateralOut, insuranceIn, state.totalClaims.bond * state.totalClaims.insurance)
  return _collateralOut
}

export default {
  getAsset,
  getCollateral,
}
