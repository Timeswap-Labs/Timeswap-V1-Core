// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {SafeCast} from './SafeCast.sol';

library PayMath {
    using SafeCast for uint256;

    function getDebt(uint112 assetPay, uint112 debt) internal pure returns (uint112 debtIn) {
        if (assetPay <= debt) return debtIn = assetPay;
        debtIn = debt;
    }

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
