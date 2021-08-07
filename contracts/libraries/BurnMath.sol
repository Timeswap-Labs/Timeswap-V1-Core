// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IData} from '../interfaces/IData.sol';
import {FullMath} from './FullMath.sol';
import {SafeCast} from './SafeCast.sol';

library BurnMath {
    using FullMath for uint256;
    using SafeCast for uint256;

    function getAsset(
        uint256 liquidityIn,
        uint128 assetState,
        uint128 assetLock,
        uint128 totalBonds,
        uint256 totalLiquidity
    ) internal pure returns (uint128 assetOut) {
        uint256 assetReserve = assetState + assetLock;
        if (assetReserve <= totalBonds) return assetOut;
        uint256 _assetOut = assetReserve;
        _assetOut -= totalBonds;
        _assetOut = _assetOut.mulDiv(liquidityIn, totalLiquidity);
        assetOut = _assetOut.toUint128();
    }

    function getCollateral(
        uint256 liquidityIn,
        IData.Tokens memory reserves,
        IData.Claims memory supplies,
        uint256 totalLiquidity
    ) internal pure returns (uint128 collateralOut) {
        uint256 _collateralOut = reserves.collateral;
        if (reserves.asset >= supplies.bond) {
            _collateralOut = _collateralOut.mulDiv(liquidityIn, totalLiquidity);
            return collateralOut = _collateralOut.toUint128();
        }
        uint256 _reduce = supplies.bond;
        _reduce -= reserves.asset;
        _reduce *= supplies.insurance;
        if (reserves.collateral * supplies.bond <= _reduce) return collateralOut;
        _collateralOut *= supplies.bond;
        _collateralOut -= _reduce;
        _collateralOut = _collateralOut.mulDiv(liquidityIn, totalLiquidity * supplies.bond);
        collateralOut = _collateralOut.toUint128();
    }

    function getCollateral(
        uint256 liquidityIn,
        uint128 assetState,
        IData.Tokens memory lock,
        IData.Claims memory supplies,
        uint256 totalLiquidity
    ) internal pure returns (uint128 collateralOut) {
        uint256 assetReserve = assetState + lock.asset;
        uint256 _collateralOut = lock.collateral;
        if (assetReserve >= supplies.bond) {
            _collateralOut = _collateralOut.mulDiv(liquidityIn, totalLiquidity);
            return collateralOut = _collateralOut.toUint128();
        }
        uint256 _reduce = supplies.bond;
        _reduce -= assetReserve;
        _reduce *= supplies.insurance;
        if (lock.collateral * supplies.bond <= _reduce) return collateralOut;
        _collateralOut *= supplies.bond;
        _collateralOut -= _reduce;
        _collateralOut = _collateralOut.mulDiv(liquidityIn, totalLiquidity * supplies.bond);
        collateralOut = _collateralOut.toUint128();
    }
}
