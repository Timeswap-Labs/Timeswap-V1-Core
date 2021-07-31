// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';

library WithdrawMath {
    using SafeCast for uint256;

    function getAsset(
        uint128 bondIn,
        uint128 reserve,
        uint128 supply
    ) internal pure returns (uint128 assetOut) {
        if (reserve >= supply) return assetOut = bondIn;
        uint256 _assetOut = reserve;
        _assetOut *= bondIn;
        _assetOut /= supply;
        assetOut = _assetOut.toUint128();
    }

    function getCollateral(
        uint128 insuranceIn,
        IPair.Tokens memory reserves,
        IPair.Claims memory supplies
    ) internal pure returns (uint128 collateralOut) {
        if (reserves.asset >= supplies.bond) return collateralOut = 0;
        uint256 _collateralOut = supplies.bond;
        _collateralOut -= reserves.asset;
        _collateralOut *= supplies.insurance;
        _collateralOut /= supplies.bond; // problem mulDiv
        if (reserves.collateral >= _collateralOut) return collateralOut = insuranceIn;
        _collateralOut *= insuranceIn;
        _collateralOut /= supplies.insurance;
        collateralOut = _collateralOut.toUint128();
    }
}
