import { mulDiv } from '../libraries/FullMath'

export function getAsset(
    liquidityIn: bigint,
    assetState: bigint,
    assetLock: bigint,
    totalBonds: bigint,
    totalLiquidity: bigint
) : bigint {
    
    const assetReserve = assetState
    if (assetReserve <= totalBonds) return 0n
    let _assetOut = assetReserve
    _assetOut -= totalBonds
    _assetOut = mulDiv(_assetOut, liquidityIn, totalLiquidity)
    return _assetOut
}

export function getCollateral(
    liquidityIn: bigint,
    assetState: bigint,
    lock: {
        asset: bigint,
        collateral: bigint
    }    ,
    supplies: {
        bond: bigint,
        insurance: bigint
    },
    totalLiquidity: bigint
) : bigint {
    let assetReserve = assetState
    let _collateralOut = lock.collateral
    if (assetReserve >= supplies.bond) {
        _collateralOut = mulDiv(_collateralOut, liquidityIn, totalLiquidity)
        return _collateralOut 
    }
    let _reduce = supplies.bond
    _reduce -= assetReserve
    _reduce *= supplies.insurance
    if (lock.collateral * supplies.bond <= _reduce) return 0n
    _collateralOut *= supplies.bond
    _collateralOut -= _reduce
    _collateralOut = mulDiv(_collateralOut, liquidityIn, totalLiquidity * supplies.bond)
    return _collateralOut
}

export default {
    getAsset,
    getCollateral
}