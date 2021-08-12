import { divUp, shiftUp } from "../libraries/Math"
import { mulDivUp } from "../libraries/FullMath"
import { checkConstantProduct  } from "../libraries/ConstantProduct"

export function check(
    state: {
        asset: bigint
        interest: bigint
        cdp: bigint
      },
    assetOut: bigint,
    interestIncrease: bigint,
    cdpIncrease: bigint,
    fee: bigint
): boolean {
    const feeBase = 0x10000n - fee
    const assetReserve = state.asset - assetOut
    if (assetReserve < 0) return false
    const interestAdjusted = adjust(interestIncrease, state.interest, feeBase)
    const cdpAdjusted = adjust(cdpIncrease, state.cdp, feeBase)
    const productCheck = checkConstantProduct(state, assetReserve, interestAdjusted, cdpAdjusted)
    if (!productCheck) return false

    let minimum = assetOut
    minimum *= state.interest
    minimum = divUp(minimum, (assetReserve << 4n))
    if (interestIncrease < minimum) return false
    return true    
}

export function adjust (
    increase: bigint,
    reserve: bigint,
    feeBase: bigint
): bigint {
    let adjusted =  reserve
    adjusted <<= 16n
    adjusted += feeBase * increase
    return adjusted
}

export function getDebt(
    maturity: bigint,
    assetOut: bigint,
    interestIncrease: bigint,
    now: bigint
) : bigint {
    let _debtOut = maturity
    _debtOut -= now
    _debtOut *= interestIncrease
    _debtOut = shiftUp(_debtOut, 32n)
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
) : bigint {
    let _collateralIn = maturity
    _collateralIn -= now
    _collateralIn *= state.interest
    _collateralIn += (state.asset << 32n)
    let denominator = state.asset
    denominator -= assetOut
    denominator *= (state.asset << 32n)
    _collateralIn = mulDivUp(_collateralIn, (assetOut * state.cdp), denominator)
    _collateralIn += cdpIncrease
    return _collateralIn
}


export default {
    check,
    adjust,
    getDebt,
    getCollateral
}