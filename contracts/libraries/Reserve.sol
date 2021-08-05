// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from '../interfaces/IERC20.sol';
import {IPair} from '../interfaces/IPair.sol';
import {SafeBalance} from './SafeBalance.sol';
import {SafeCast} from './SafeCast.sol';

library Reserve {
    using SafeBalance for IERC20;
    using SafeCast for uint256;

    function getAssetIn(IERC20 asset, IPair.Tokens storage reserves) internal returns (uint128 assetIn) {
        uint128 assetReserve = asset.safeBalance().truncateUint128();
        assetIn = assetReserve - reserves.asset;
        reserves.asset = assetReserve;
    }

    function getCollateralIn(IERC20 collateral, IPair.Tokens storage reserves)
        internal
        returns (uint112 collateralIn)
    {
        uint128 collateralReserve = collateral.safeBalance().truncateUint128();
        uint256 _collateralIn = collateralReserve - reserves.collateral;
        collateralIn = _collateralIn.toUint112();
        reserves.collateral = collateralReserve;
    }

    function getExcess(IERC20 token, uint128 reserve) internal view returns (uint256 excess) {
        excess = token.safeBalance() - reserve;
    }
}
