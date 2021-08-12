import { mulDiv } from '../libraries/FullMath'

export function getAsset(
    bondIn: bigint,
    assetState: bigint,
    assetLock: bigint,
    totalBonds: bigint
) : bigint {
    let assetReserve = assetState + assetLock
    if (assetReserve >= totalBonds) return bondIn
    let _assetOut = bondIn
    _assetOut *= assetReserve
    _assetOut /= totalBonds
    return _assetOut
}

export function getCollateral(
    insuranceIn: bigint,
    assetState: bigint,
    lock: {
        asset: bigint,
        collateral: bigint
    }    ,
    supplies: {
        bond: bigint,
        insurance: bigint
    },
) : bigint {
    let assetReserve = assetState + lock.asset
    if (assetReserve >= supplies.bond) return 0n
    let _collateralOut = supplies.bond
    _collateralOut -= assetReserve
    _collateralOut *= supplies.insurance
    if (lock.collateral * supplies.bond >= _collateralOut) return insuranceIn
    _collateralOut = mulDiv(_collateralOut, insuranceIn, supplies.bond * supplies.insurance)
    return _collateralOut
}

export default {
    getAsset,
    getCollateral
}