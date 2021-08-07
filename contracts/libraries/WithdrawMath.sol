// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IData} from '../interfaces/IData.sol';
import {FullMath} from './FullMath.sol';
import {SafeCast} from './SafeCast.sol';

library WithdrawMath {
    using FullMath for uint256;
    using SafeCast for uint256;

    function getAsset(
        uint128 bondIn,
        uint128 assetState,
        uint128 assetLock,
        uint128 totalBonds
    ) internal pure returns (uint128 assetOut) {
        uint256 assetReserve = assetState + assetLock;
        if (assetReserve >= totalBonds) return assetOut = bondIn;
        uint256 _assetOut = bondIn;
        _assetOut *= assetReserve;
        _assetOut /= totalBonds;
        assetOut = _assetOut.toUint128();
    }

    function getCollateral(
        uint128 insuranceIn,
        uint128 assetState,
        IData.Tokens memory lock,
        IData.Claims memory supplies
    ) internal pure returns (uint128 collateralOut) {
        uint256 assetReserve = assetState + lock.asset;
        if (assetReserve >= supplies.bond) return collateralOut;
        uint256 _collateralOut = supplies.bond;
        _collateralOut -= assetReserve;
        _collateralOut *= supplies.insurance;
        if (lock.collateral * supplies.bond >= _collateralOut) return collateralOut = insuranceIn;
        _collateralOut = _collateralOut.mulDiv(insuranceIn, supplies.bond * supplies.insurance);
        collateralOut = _collateralOut.toUint128();
    }
}
