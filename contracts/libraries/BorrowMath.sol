// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';
import {Math} from './Math.sol';

library BorrowMath {
    using Math for uint256;
    using SafeCast for uint256;

    function getParameter(
        IPair.Parameter memory _parameter,
        uint128 assetOut,
        uint128 collateralIn,
        uint128 interestIncrease,
        uint128 cdpIncrease
    ) internal pure returns (IPair.Parameter memory parameter) {
        parameter.reserves.asset = _parameter.reserves.asset - assetOut;
        parameter.reserves.collateral = _parameter.reserves.collateral + collateralIn;
        parameter.interest = _parameter.interest + interestIncrease;
        parameter.cdp = _parameter.cdp + cdpIncrease;
    }

    function checkInterest(
        uint128 assetOut,
        uint128 interestIncrease,
        uint128 newAssetReserve,
        uint128 interest
    ) internal pure {
        uint256 minimum = assetOut;
        minimum *= interest;
        minimum = minimum.divUp(newAssetReserve);
        minimum = minimum.shiftUp(4);
        require(interestIncrease >= minimum, 'Invalid');
    }

    function getDebt(
        uint128 assetOut,
        uint128 interestIncrease,
        uint256 duration
    ) internal pure returns (uint128 amount) {
        uint256 _amount = duration;
        _amount *= interestIncrease;
        _amount = _amount.shiftUp(32);
        _amount += assetOut;
        amount = _amount.toUint128();
    }

    function getCollateral(
        uint128 debtOut,
        uint128 cdpIncrease,
        uint128 newAssetReserve,
        uint128 cdp
    ) internal pure returns (uint128 amount) {
        uint256 _amount = debtOut;
        _amount *= cdp;
        _amount = _amount.divUp(newAssetReserve);
        _amount += cdpIncrease;
        amount = _amount.toUint128();
    }
}