import { mulDiv } from '../libraries/FullMath'
import { State } from '../shared/PairInterface'

export function getAsset(state: State, liquidityIn: bigint): bigint {
  const assetReserve = state.reserves.asset
  if (assetReserve <= state.totalClaims.bond) return 0n
  let _assetOut = assetReserve
  _assetOut -= state.totalClaims.bond
  _assetOut = mulDiv(_assetOut, liquidityIn, state.totalLiquidity)
  return _assetOut
}

export function getCollateral(state: State, liquidityIn: bigint): bigint {
  let assetReserve = state.reserves.asset
  let _collateralOut = state.reserves.collateral
  if (assetReserve >= state.totalClaims.bond) {
    _collateralOut = mulDiv(_collateralOut, liquidityIn, state.totalLiquidity)
    return _collateralOut
  }
  let _reduce = state.totalClaims.bond
  _reduce -= assetReserve
  _reduce *= state.totalClaims.insurance
  if (state.reserves.collateral * state.totalClaims.bond <= _reduce) return 0n
  _collateralOut *= state.totalClaims.bond
  _collateralOut -= _reduce
  _collateralOut = mulDiv(_collateralOut, liquidityIn, state.totalLiquidity * state.totalClaims.bond)
  return _collateralOut
}

export default {
  getAsset,
  getCollateral,
}
