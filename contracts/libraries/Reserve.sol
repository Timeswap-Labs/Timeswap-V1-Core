// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from '../interfaces/IERC20.sol';
import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';

library Reserve {
    using SafeCast for uint256;

    function getAssetIn(IERC20 asset, IPair.Tokens storage reserves) internal returns (uint128 assetIn) {
        uint128 assetReserve = asset.balanceOf(address(this)).truncateUint128();
        assetIn = assetReserve - reserves.asset;
        reserves.asset = assetReserve;
    }

    function getCollateralIn(IERC20 collateral, IPair.Tokens storage reserves)
        internal
        returns (uint128 collateralIn)
    {
        uint128 collateralReserve = collateral.balanceOf(address(this)).truncateUint128();
        collateralIn = collateralReserve - reserves.collateral;
        reserves.collateral = collateralReserve;
    }

    function getExcess(IERC20 token, uint128 reserve) internal view returns (uint256 excess) {
        excess = token.balanceOf(address(this)) - reserve;
    }
}
