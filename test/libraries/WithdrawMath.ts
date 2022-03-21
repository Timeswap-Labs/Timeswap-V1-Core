import { State, Tokens, TotalClaims } from '../shared/PairInterface'
import { mulDiv } from './FullMath'

export function getTokensOut(state: State, claimsIn: TotalClaims): Tokens {
  let totalAsset = state.reserves.asset
  let totalBondPrincipal = state.totalClaims.bondPrincipal
  let totalBondInterest = state.totalClaims.bondInterest
  let totalBond = totalBondPrincipal
  totalBond += totalBondInterest
  let tokensOut: Tokens = {
    asset: 0n,
    collateral: 0n,
  }

  if (totalAsset >= totalBond) {
    tokensOut.asset = claimsIn.bondPrincipal
    tokensOut.asset += claimsIn.bondInterest
  } else {
    if (totalAsset >= totalBondPrincipal) {
      let remaining = totalAsset
      remaining -= totalBondPrincipal
      let _assetOut = claimsIn.bondInterest
      _assetOut *= remaining
      _assetOut /= totalBondInterest
      _assetOut += claimsIn.bondPrincipal
      tokensOut.asset = _assetOut
    } else {
      let _assetOut = claimsIn.bondPrincipal
      _assetOut *= totalAsset
      _assetOut /= totalBondPrincipal
      tokensOut.asset = _assetOut
    }

    let deficit = totalBond
    deficit -= totalAsset

    let totalInsurancePrincipal = state.totalClaims.insurancePrincipal
    totalInsurancePrincipal *= deficit
    let totalInsuranceInterest = state.totalClaims.insuranceInterest
    totalInsuranceInterest *= deficit
    let totalInsurance = totalInsurancePrincipal
    totalInsurance += totalInsuranceInterest

    let totalCollateral = state.reserves.collateral
    totalCollateral *= totalBond

    if (totalCollateral >= totalInsurance) {
      let _collateralOut = claimsIn.insurancePrincipal
      _collateralOut += claimsIn.insuranceInterest
      _collateralOut *= deficit
      _collateralOut /= totalBond
      tokensOut.collateral = _collateralOut
    } else if (totalCollateral >= totalInsurancePrincipal) {
      let remaining = totalCollateral
      remaining -= totalInsurancePrincipal
      let _collateralOut = claimsIn.insuranceInterest
      _collateralOut *= deficit
      let denominator = totalInsuranceInterest
      denominator *= totalBond
      _collateralOut = mulDiv(_collateralOut, remaining, denominator)
      let addend = claimsIn.insurancePrincipal
      addend *= deficit
      addend /= totalBond
      _collateralOut += addend
      tokensOut.collateral = _collateralOut
    } else {
      let _collateralOut = claimsIn.insurancePrincipal
      _collateralOut *= deficit
      let denominator = totalInsurancePrincipal
      denominator *= totalBond
      _collateralOut = mulDiv(_collateralOut, totalCollateral, denominator)
      tokensOut.collateral = _collateralOut
    }
  }

  return tokensOut
}

export default {
  getTokensOut,
}
