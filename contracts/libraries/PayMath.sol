// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {SafeCast} from './SafeCast.sol';
import {Math} from './Math.sol';

library PayMath {
    using SafeCast for uint256;

    function getCollateral(
        uint112 debtPay,
        uint112 collateral,
        uint112 debt
    ) internal pure returns (uint112 collateralOut) {
        if (debtPay >= debt) return collateralOut = collateral;
        uint256 _collateralOut = collateral;
        _collateralOut *= debtPay;
        _collateralOut /= debt;
        collateralOut = _collateralOut.toUint112();
    }
}
