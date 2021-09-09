// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {FullMath} from './FullMath.sol';
import {SafeCast} from './SafeCast.sol';

library WithdrawMath {
    using FullMath for uint256;
    using SafeCast for uint256;

    function getAsset(
        IPair.State memory state,
        uint128 bondIn
    ) internal pure returns (uint128 assetOut) {
        uint256 assetReserve = state.reserves.asset;
        if (assetReserve >= state.totalClaims.bond) return assetOut = bondIn;
        uint256 _assetOut = bondIn;
        _assetOut *= assetReserve;
        _assetOut /= state.totalClaims.bond;
        assetOut = _assetOut.toUint128();
    }

    function getCollateral(
        IPair.State memory state,
        uint128 insuranceIn
    ) internal pure returns (uint128 collateralOut) {
        uint256 assetReserve = state.reserves.asset;
        if (assetReserve >= state.totalClaims.bond) return collateralOut;
        uint256 _collateralOut = state.totalClaims.bond;
        _collateralOut -= assetReserve;
        _collateralOut *= state.totalClaims.insurance;
        if (state.reserves.collateral * state.totalClaims.bond >= _collateralOut) 
            return collateralOut = insuranceIn;
        _collateralOut = _collateralOut.mulDiv(insuranceIn, state.totalClaims.bond * state.totalClaims.insurance);
        collateralOut = _collateralOut.toUint128();
    }
}
