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
    ) internal pure returns (uint128 amount) {
        if (reserve >= supply) return amount = bondIn;
        uint256 _amount = reserve;
        _amount *= bondIn;
        _amount /= supply;
        amount = _amount.toUint128();
    }

    function getCollateral(
        uint128 insuranceIn,
        IPair.Tokens memory reserves,
        IPair.Tokens memory supplies
    ) internal pure returns (uint128 amount) {
        if (reserves.asset >= supplies.asset) return amount = 0;
        uint256 _amount = supplies.asset;
        _amount -= reserves.asset;
        _amount *= supplies.collateral;
        _amount /= supplies.asset;
        if (reserves.collateral >= _amount) return amount = insuranceIn;
        _amount *= insuranceIn;
        _amount /= supplies.collateral;
        amount = _amount.toUint128();
    }
}