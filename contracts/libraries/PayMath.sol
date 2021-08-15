// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';


library PayMath {
    using SafeCast for uint256;

    function checkProportional(
        uint112 debtIn,
        uint112 collateralOut,
        IPair.Due memory due
    ) internal pure {
        require(debtIn * due.collateral >= collateralOut * due.debt, 'Forbidden');
    }
}
