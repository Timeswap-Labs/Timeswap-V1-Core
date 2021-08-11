// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {SafeCast} from './SafeCast.sol';

library PayMath {
    using SafeCast for uint256;

    function getDebt(uint112 _debtIn, uint112 debt) internal pure returns (uint112 debtIn) {
        if (_debtIn >= debt) return debtIn = debt;
        debtIn = _debtIn;
    }

    function getCollateral(
        uint112 _collateralOut,
        uint112 debtIn,
        uint112 collateral,
        uint112 debt
    ) internal pure returns (uint112 collateralOut) {
        require(debtIn * collateral >= _collateralOut * debt, 'Forbidden');
        if (_collateralOut >= collateral) return collateralOut = collateral;
        collateralOut = _collateralOut;
    }
}
