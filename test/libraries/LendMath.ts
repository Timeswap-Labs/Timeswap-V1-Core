import { mulDiv } from '../libraries/FullMath'
import { checkConstantProduct } from '../libraries/ConstantProduct'

export function check(
  state: {
    asset: bigint
    interest: bigint
    cdp: bigint
  },
  assetIn: bigint,
  interestDecrease: bigint,
  cdpDecrease: bigint,
  fee: bigint
): boolean {
  const feeBase = 0x10000n + fee
  const assetReserve = state.asset + assetIn
  const interestAdjusted = adjust(interestDecrease, state.interest, feeBase)
  const cdpAdjusted = adjust(cdpDecrease, state.cdp, feeBase)

  if (!checkConstantProduct(state, assetReserve, interestAdjusted, cdpAdjusted)) return false
  let minimum = assetIn
  minimum *= state.interest
  minimum /= assetReserve << 4n
  if (interestDecrease < minimum) return false
  return true
}

export function adjust(decrease: bigint, reserve: bigint, feeBase: bigint): bigint {
  console.log("adjusted interest");
  let adjusted = reserve
  console.log("lendParams.interestDecrease, pairContractState.interest, feeBase");
  console.log(reserve>decrease);
  console.log(decrease, reserve, feeBase);
  adjusted <<= 16n
  console.log("reserve <<= 16n", adjusted);
  console.log("feeBase * decrease", feeBase * decrease);
  adjusted -= feeBase * decrease
  console.log("adjusted -= feeBase * decrease", adjusted);
  return adjusted
}

export function readjust(adjusted: bigint, reserve: bigint, feeBase: bigint): bigint {
  console.log("adjusted cdp");
  console.log("cdpAdjusted11, pairContractState.cdp, feeBase");
  console.log(adjusted, reserve, feeBase);
  console.log(reserve>adjusted);
  let _adjusted = reserve 
  _adjusted <<= 16n
  console.log("reserve <<= 16n", _adjusted);
  console.log("feeBase * adjusted", feeBase * adjusted);
  _adjusted -= feeBase * adjusted
  console.log("_adjusted -= feeBase * adjusted", _adjusted);
  console.log("____");
  // decrease -= adjusted // FIXME
  // decrease /= feeBase // FIXME
  return _adjusted
}

export function getBond(maturity: bigint, assetIn: bigint, interestDecrease: bigint, now: bigint): bigint {
  let _bondOut = maturity
  _bondOut -= now
  _bondOut *= interestDecrease
  _bondOut >>= 32n
  _bondOut += assetIn
  return _bondOut
}

export function getInsurance(
  maturity: bigint,
  state: {
    asset: bigint
    interest: bigint
    cdp: bigint
  },
  assetIn: bigint,
  cdpDecrease: bigint,
  now: bigint
): bigint {
  let _insuranceOut = maturity
  _insuranceOut -= now
  _insuranceOut *= state.interest
  _insuranceOut += state.asset << 32n
  let denominator = state.asset
  denominator += assetIn
  denominator *= state.asset << 32n
  _insuranceOut = mulDiv(_insuranceOut, assetIn * state.cdp, denominator)
  _insuranceOut += cdpDecrease
  return _insuranceOut
}

export default {
  check,
  adjust,
  readjust,
  getBond,
  getInsurance,
}
