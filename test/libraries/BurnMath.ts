import { mulDiv } from '../libraries/FullMath'
import { State } from '../shared/PairInterface'

export function getAsset(state: State, liquidityIn: bigint): bigint {
  if (state.reserves.asset <= state.totalClaims.bond) return 0n
  let _assetOut = state.reserves.asset
  _assetOut -= state.totalClaims.bond
  _assetOut = mulDiv(_assetOut, liquidityIn, state.totalLiquidity)
  return _assetOut
}

export function getCollateral(state: State, liquidityIn: bigint): bigint {
  let _collateralOut = state.reserves.collateral
  if (state.reserves.asset >= state.totalClaims.bond) {
    _collateralOut = mulDiv(_collateralOut, liquidityIn, state.totalLiquidity)
    return _collateralOut
  }
  let deficit = state.totalClaims.bond
  deficit -= state.reserves.asset
  // _reduce *= state.totalClaims.insurance
  if (_collateralOut * state.totalClaims.bond <= deficit * state.totalClaims.insurance) return 0n
  _collateralOut *= state.totalClaims.bond
  let subtrahend = deficit;
  subtrahend *= state.totalClaims.insurance;
  _collateralOut -= subtrahend;
  _collateralOut = mulDiv(_collateralOut, liquidityIn, state.totalLiquidity * state.totalClaims.bond)
  return _collateralOut
}

export default {
  getAsset,
  getCollateral,
}
