// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import "hardhat/console.sol";

library PayMath {
    function checkProportional(
        uint112 assetIn,
        uint112 collateralOut,
        IPair.Due memory due
    ) internal pure {
        require(uint256(assetIn) * due.collateral >= uint256(collateralOut) * due.debt, 'Forbidden');
    }
}
