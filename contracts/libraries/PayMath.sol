// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import "hardhat/console.sol";

library PayMath {
    function checkProportional(
        uint112 assetIn,
        uint112 collateralOut,
        IPair.Due memory due
    ) internal view {
        //TODO: to remove console.log and also make the function as pure
        console.log("assetIn", assetIn);  // 200
        console.log("due.collateral", due.collateral); // 71
        console.log("collateralOut", collateralOut); // 50
        console.log("due.debt", due.debt); // 201
        require(uint256(assetIn) * due.collateral >= uint256(collateralOut) * due.debt, 'Forbidden');
    }
}
