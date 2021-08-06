// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {FullMath} from './FullMath.sol';
import {SafeCast} from './SafeCast.sol';

library WithdrawMath {
    using FullMath for uint256;
    using SafeCast for uint256;

    function getAsset(
        uint128 bondIn,
        uint128 assetReserve,
        uint128 totalBonds
    ) internal pure returns (uint128 assetOut) {
        if (assetReserve >= totalBonds) return assetOut = bondIn;
        uint256 _assetOut = bondIn;
        _assetOut *= assetReserve;
        _assetOut /= totalBonds;
        assetOut = _assetOut.toUint128();
    }

    function getCollateral(
        uint128 insuranceIn,
        IPair.Tokens memory reserves,
        IPair.Claims memory supplies
    ) internal pure returns (uint128 collateralOut) {
        if (reserves.asset >= supplies.bond) return collateralOut;
        uint256 _collateralOut = supplies.bond;
        _collateralOut -= reserves.asset;
        _collateralOut *= supplies.insurance;
        if (reserves.collateral * supplies.bond >= _collateralOut) return collateralOut = insuranceIn;
        _collateralOut = _collateralOut.mulDiv(insuranceIn, supplies.bond * supplies.insurance);
        collateralOut = _collateralOut.toUint128();
    }
}
