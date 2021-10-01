// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {Math} from './Math.sol';
import {FullMath} from './FullMath.sol';
import {SafeCast} from './SafeCast.sol';

library MintMath {
    using Math for uint256;
    using FullMath for uint256;
    using SafeCast for uint256;

    function getLiquidityTotal(
        uint112 xIncrease
    ) internal pure returns (uint256 liquidityTotal) {
        liquidityTotal = xIncrease;
        liquidityTotal <<= 56;
    }

    function getLiquidityTotal(
        IPair.State memory state,
        uint112 xIncrease,
        uint112 yIncrease,
        uint112 zIncrease
    ) internal pure returns (uint256 liquidityTotal) {
        liquidityTotal = min(
            state.totalLiquidity.mulDiv(xIncrease, state.x),
            state.totalLiquidity.mulDiv(yIncrease, state.y),
            state.totalLiquidity.mulDiv(zIncrease, state.z)
        );
    }

    function getLiquidity(
        uint256 maturity,
        uint256 liquidityTotal,
        uint16 protocolFee
    ) internal view returns (uint256 liquidityOut) {
        uint256 denominator = maturity;
        denominator -= block.timestamp;
        denominator *= protocolFee;
        denominator += 0x10000000000;
        liquidityOut = liquidityTotal.mulDiv(0x10000000000, denominator);
    }

    function min(
        uint256 x,
        uint256 y,
        uint256 z
    ) private pure returns (uint256 w) {
        if (x <= y && x <= z) {
            w = x;
        } else if (y <= x && y <= z) {
            w = y;
        } else {
            w = z;
        }
    }

    function getDebt(
        uint256 maturity,
        uint112 xIncrease,
        uint112 yIncrease
    ) internal view returns (uint112 debtIn) {
        uint256 _debtIn = maturity;
        _debtIn -= block.timestamp;
        _debtIn *= yIncrease;
        _debtIn = _debtIn.shiftUp(32); 
        _debtIn += xIncrease;
        console.log("_debtInL71", _debtIn);
        debtIn = _debtIn.toUint112();
    }

    function getCollateral(
        uint256 maturity,
        uint112 xIncrease,
        uint112 yIncrease,
        uint112 zIncrease
    ) internal view returns (uint112 collateralIn) {
        uint256 _collateralIn = maturity;
        _collateralIn -= block.timestamp;
        _collateralIn *= yIncrease;
        _collateralIn += uint256(xIncrease) << 33;
        _collateralIn = _collateralIn.mulDivUp(zIncrease, uint256(xIncrease) << 32);
        collateralIn = _collateralIn.toUint112();
    }
}
