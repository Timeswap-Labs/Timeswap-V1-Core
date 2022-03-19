import { mulDiv } from '../libraries/FullMath'
import { State, totalClaimsDefault } from '../shared/PairInterface'
import { divUp } from './Math'

export function getAsset(state: State, liquidityIn: bigint): bigint {
  let totalBond = state.totalClaims.bondPrincipal + state.totalClaims.bondInterest
  if (state.reserves.asset >= totalBond) {
    let _assetOut = state.reserves.asset
    _assetOut -= totalBond
    _assetOut = mulDiv(_assetOut, liquidityIn, state.totalLiquidity)
    return _assetOut
  } else return 0n
}

export function getCollateral(state: State, liquidityIn: bigint): bigint {
  let totalBond = state.totalClaims.bondPrincipal + state.totalClaims.bondInterest
  let totalInsurance = state.totalClaims.insurancePrincipal + state.totalClaims.insuranceInterest
  let _collateralOut = state.reserves.collateral
  if (state.reserves.asset >= totalBond) {
    _collateralOut = mulDiv(_collateralOut, liquidityIn, state.totalLiquidity)
    return _collateralOut
  } else {
    let deficit = totalBond
    deficit -= state.reserves.asset
    if (state.reserves.collateral * totalBond > deficit * totalInsurance) {
      let _collateralOut = state.reserves.collateral
      let subtrahend = deficit
      subtrahend *= totalInsurance
      subtrahend = divUp(subtrahend, totalBond)
      _collateralOut -= subtrahend
      _collateralOut = mulDiv(_collateralOut, liquidityIn, state.totalLiquidity)
      console.log('returning')
      return _collateralOut
    } else {
      return 0n
    }
  }
}
export function getFee(state: State, liquidityIn: bigint) {
  return mulDiv(state.feeStored, liquidityIn, state.totalLiquidity)
}

export default {
  getAsset,
  getCollateral,
  getFee,
}
