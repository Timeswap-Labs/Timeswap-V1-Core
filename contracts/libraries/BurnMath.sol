// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {FullMath} from './FullMath.sol';
import {SafeCast} from './SafeCast.sol';

/// @title BurnMath library
/// @author Timeswap Labs
library BurnMath {
    using FullMath for uint256;
    using SafeCast for uint256;

    /// @dev Get the asset for the liquidity burned.
    /// @param state The pool state.
    /// @param liquidityIn The amount of liquidity balance burnt by the msg.sender.
    function getAsset(IPair.State memory state, uint256 liquidityIn) internal pure returns (uint128 assetOut) {
        uint256 assetReserve = state.reserves.asset;
        if (assetReserve <= state.totalClaims.bond) return assetOut;
        uint256 _assetOut = assetReserve;
        _assetOut -= state.totalClaims.bond;
        _assetOut = _assetOut.mulDiv(liquidityIn, state.totalLiquidity);
        assetOut = _assetOut.toUint128();
    }

    /// @dev Get the collateral for the liquidity burned.
    /// @param state The pool state.
    /// @param liquidityIn The amount of liquidity balance burnt by the msg.sender.
    function getCollateral(IPair.State memory state, uint256 liquidityIn)
        internal
        pure
        returns (uint128 collateralOut)
    {
        uint256 assetReserve = state.reserves.asset;
        uint256 _collateralOut = state.reserves.collateral;
        if (assetReserve >= state.totalClaims.bond) {
            _collateralOut = _collateralOut.mulDiv(liquidityIn, state.totalLiquidity);
            return collateralOut = _collateralOut.toUint128();
        }
        uint256 _reduce = state.totalClaims.bond;
        _reduce -= assetReserve;
        _reduce *= state.totalClaims.insurance;
        if (uint256(state.reserves.collateral) * state.totalClaims.bond <= _reduce) return collateralOut;
        _collateralOut *= state.totalClaims.bond;
        _collateralOut -= _reduce;
        _collateralOut = _collateralOut.mulDiv(liquidityIn, state.totalLiquidity * state.totalClaims.bond);
        collateralOut = _collateralOut.toUint128();
    }
}