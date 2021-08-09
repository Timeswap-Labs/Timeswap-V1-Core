// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {SafeCast} from './SafeCast.sol';

library PayMath {
    using SafeCast for uint256;

    function getDebt(uint112 _debtIn, uint112 debt) internal pure returns (uint112 debtIn) {
        if (_debtIn <= debt) return debtIn = _debtIn;
        debtIn = _debtIn;
    }

    function getCollateral(
        uint112 debtIn,
        uint112 collateral,
        uint112 debt
    ) internal pure returns (uint112 collateralOut) {
        if (debtIn >= debt) return collateralOut = collateral;
        uint256 _collateralOut = collateral;
        _collateralOut *= debtIn;
        _collateralOut /= debt;
        collateralOut = _collateralOut.toUint112();
    }
}
