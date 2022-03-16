// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {TimeswapMath} from '../../libraries/TimeswapMath.sol';
import {IPair} from '../../interfaces/IPair.sol';

contract TimeswapMathTest {

    function mint(
        uint256 maturity,
        IPair.State memory state,
        uint112 xIncrease, 
        uint112 yIncrease, 
        uint112 zIncrease
    ) external 
        view 
        returns(
            uint256 liquidityOut,
            IPair.Due memory dueOut,
            uint256 feeStoredIncrease
        ) {
            return TimeswapMath.mint(
            maturity,
            state,
            xIncrease, 
            yIncrease, 
            zIncrease 
            );
        }

   
}