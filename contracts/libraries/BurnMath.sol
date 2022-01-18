// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {IPair} from '../interfaces/IPair.sol';
import {FullMath} from './FullMath.sol';
import {Math} from './Math.sol';
import {SafeCast} from './SafeCast.sol';

/// @title BurnMath library
/// @author Timeswap Labs
library BurnMath {
    using FullMath for uint256;
    using Math for uint256;
    using SafeCast for uint256;

    /// @dev Get the asset for the liquidity burned.
    /// @param state The pool state.
    /// @param liquidityIn The amount of liquidity balance burnt by the msg.sender.
    function getAsset(IPair.State memory state, uint256 liquidityIn) internal pure returns (uint128 assetOut) {
        uint256 totalAsset = state.reserves.asset;
        uint256 totalBond = state.totalClaims.bond;
        
        if (totalAsset <= totalBond) return assetOut;
        uint256 _assetOut = totalAsset;
        unchecked { _assetOut -= totalBond; }
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
        uint256 totalAsset = state.reserves.asset;
        uint256 totalCollateral = state.reserves.collateral;
        uint256 totalBond = state.totalClaims.bond;
        uint256 totalInsurance = state.totalClaims.insurance;

        uint256 _collateralOut = totalCollateral;
        if (totalAsset >= totalBond) {
            _collateralOut = _collateralOut.mulDiv(liquidityIn, state.totalLiquidity);
            return collateralOut = _collateralOut.toUint128();
        }
        uint256 deficit = totalBond;
        unchecked { deficit -= totalAsset; }
        if (totalCollateral * totalBond <= deficit * totalInsurance) return collateralOut;
        uint256 subtrahend = deficit;
        subtrahend *= totalInsurance;
        subtrahend = subtrahend.divUp(totalBond);
        _collateralOut -= subtrahend;
        _collateralOut = _collateralOut.mulDiv(liquidityIn, state.totalLiquidity);
        collateralOut = _collateralOut.toUint128();
    }
}