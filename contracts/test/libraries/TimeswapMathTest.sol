// SPDX-License-Identifier: UNLICENSED
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

    function burn(
        IPair.State memory state,
        uint256 liquidityIn
    )
        external
        pure
        returns (
            uint128 assetOut,
            uint128 collateralOut,
            uint256 feeOut
        ) {
            return TimeswapMath.burn(state, liquidityIn);
        }
    
    function lend(
        uint256 maturity,
        IPair.State memory state,
        uint112 xIncrease,
        uint112 yDecrease,
        uint112 zDecrease,
        uint256 fee,
        uint256 protocolFee
    )
        external
        view
        returns (
            IPair.Claims memory claimsOut,
            uint256 feeStoredIncrease,
            uint256 protocolFeeStoredIncrease
        ) {
            return TimeswapMath.lend(maturity, state, xIncrease, yDecrease, zDecrease, fee, protocolFee);
        }

    function withdraw(
        IPair.State memory state,
        IPair.Claims memory claimsIn
    ) external pure returns (IPair.Tokens memory tokensOut) {
        return TimeswapMath.withdraw(state, claimsIn);
    }

    function borrow(
        uint256 maturity,
        IPair.State memory state,
        uint112 xDecrease,
        uint112 yIncrease,
        uint112 zIncrease,
        uint256 fee,
        uint256 protocolFee
    )
        external
        view
        returns (
            IPair.Due memory dueOut,
            uint256 feeStoredIncrease,
            uint256 protocolFeeStoredIncrease
        )
        {
            return TimeswapMath.borrow(maturity, state, xDecrease, yIncrease, zIncrease, fee, protocolFee);
        }
}