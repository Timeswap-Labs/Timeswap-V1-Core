// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {FullMath} from './FullMath.sol';
import {SafeCast} from './SafeCast.sol';

library BurnMath {
    using FullMath for uint256;
    using SafeCast for uint256;

    function getAsset(
        uint256 liquidityIn,
        uint128 reserve,
        uint128 totalBond,
        uint256 totalLiquidity
    ) internal pure returns (uint128 assetOut) {
        if (reserve <= totalBond) return assetOut;
        uint256 _assetOut = reserve;
        _assetOut -= totalBond;
        _assetOut *= liquidityIn;
        _assetOut /= totalLiquidity;
        assetOut = _assetOut.toUint128();
    }

    function getCollateral(
        uint256 liquidityIn,
        IPair.Tokens memory reserves,
        IPair.Claims memory supplies,
        uint256 totalLiquidity
    ) internal pure returns (uint128 collateralOut) {
        uint256 _collateralOut = reserves.collateral;
        if (reserves.asset <= supplies.bond) {
            uint256 _reduce = supplies.bond;
            _reduce -= reserves.asset;
            _reduce *= supplies.insurance;
            if (reserves.collateral * supplies.bond <= _reduce) return collateralOut;
            _collateralOut *= supplies.bond;
            _collateralOut -= _reduce;
            _collateralOut /= supplies.bond;
        }
        _collateralOut = _collateralOut.mulDiv(liquidityIn, totalLiquidity);
        collateralOut = _collateralOut.toUint128();
    }
}
