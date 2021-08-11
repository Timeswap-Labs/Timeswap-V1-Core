import { mulDiv } from '../libraries/FullMath'
import { checkConstantProduct  } from "../libraries/ConstantProduct"
import { now } from "../shared/Helper"

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
) : boolean {
    const feeBase = 0x10000n + fee
    const assetReserve = state.asset + assetIn
    const interestAdjusted = adjust(interestDecrease, state.interest, feeBase)
    const cdpAdjusted = adjust(cdpDecrease, state.cdp, feeBase)
    checkConstantProduct(state, assetReserve, interestAdjusted, cdpAdjusted)

    let minimum = assetIn
    minimum *= state.interest
    minimum /= (assetReserve << 4n)
    if (interestDecrease < minimum) return false
    return true
}

export function adjust(
    decrease: bigint,
    reserve: bigint,
    feeBase: bigint
) : bigint {
    let adjusted = reserve
    adjusted <<= 16n
    adjusted -= feeBase * decrease
    return adjusted
}

export async function getBond(
    maturity: bigint,
    assetIn: bigint,
    interestDecrease: bigint
) : Promise<bigint> {
    let _bondOut = maturity
    _bondOut -= await now()
    _bondOut *= interestDecrease
    _bondOut >>= 32n
    _bondOut += assetIn
    return _bondOut
}

export async function getInsurance(
    maturity: bigint,
    state: {
        asset: bigint
        interest: bigint
        cdp: bigint
      },
    assetIn: bigint,
    cdpDecrease: bigint
) : Promise<bigint> {
    let _insuranceOut = maturity
    _insuranceOut -= await now()
    _insuranceOut *= state.interest
    _insuranceOut += (state.asset << 32n)
    let denominator = state.asset
    denominator += assetIn
    denominator *= (state.asset << 32n)
    _insuranceOut = mulDiv(_insuranceOut, (assetIn * state.cdp), denominator)
    _insuranceOut += cdpDecrease
    return _insuranceOut
}

export default {
    check,
    getBond,
    getInsurance
}