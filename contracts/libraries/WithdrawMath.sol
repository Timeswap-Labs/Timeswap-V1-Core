// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';

/// @title BurnMath library
/// @author Timeswap Labs
library WithdrawMath {
    using SafeCast for uint256;

    /// @dev Get the asset for the liquidity burned.
    /// @param state The pool state.
    /// @param bondIn The amount of bond balance balance burnt by the msg.sender.
    function getAsset(IPair.State memory state, uint128 bondIn) internal pure returns (uint128 assetOut) {
        uint256 totalAsset = state.reserves.asset;
        uint256 totalBond = state.totalClaims.bond;
        
        if (totalAsset >= totalBond) return assetOut = bondIn;
        uint256 _assetOut = bondIn;
        _assetOut *= totalAsset;
        _assetOut /= totalBond;
        assetOut = _assetOut.toUint128();
    }

    /// @dev Get the collateral for the liquidity burned.
    /// @param state The pool state.
    /// @param insuranceIn The amount of insurance balance burnt by the msg.sender.
    function getCollateral(IPair.State memory state, uint128 insuranceIn)
        internal
        pure
        returns (uint128 collateralOut)
    {
        uint256 totalAsset = state.reserves.asset;
        uint256 totalCollateral = state.reserves.collateral;
        uint256 totalBond = state.totalClaims.bond;
        uint256 totalInsurance = state.totalClaims.insurance;

        if (totalAsset >= totalBond) return collateralOut;
        uint256 deficit = totalBond;
        unchecked { deficit -= totalAsset; }
        if (totalCollateral * totalBond >= deficit * totalInsurance) {
            uint256 _collateralOut = deficit;
            _collateralOut *= insuranceIn;
            _collateralOut /= totalBond;
            return collateralOut = _collateralOut.toUint128();
        }
        uint256 __collateralOut = state.reserves.collateral;
        __collateralOut *= insuranceIn;
        __collateralOut /= totalInsurance;
        collateralOut = __collateralOut.toUint128();
    }
}
