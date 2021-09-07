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
        liquidityTotal <<= 40;
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
        uint256 w,
        uint256 x,
        uint256 y
    ) private pure returns (uint256 z) {
        if (w <= x && w <= y) {
            z = w;
        } else if (x <= w && x <= y) {
            z = x;
        } else {
            z = y;
        }
    }

    function getDebt(
        uint256 maturity,
        uint112 xIncrease,
        uint112 yIncrease
    ) internal view returns (uint112 debtOut) {
        uint256 _debtOut = maturity;
        _debtOut -= block.timestamp;
        _debtOut *= yIncrease;
        _debtOut = _debtOut.shiftUp(32);
        _debtOut += xIncrease;
        debtOut = _debtOut.toUint112();
    }

    function getCollateral(
        uint256 maturity,
        uint112 xIncrease,
        uint112 yIncrease,
        uint112 zIncrease
    ) internal view returns (uint112 collateralOut) {
        uint256 _collateralOut = maturity;
        _collateralOut -= block.timestamp;
        _collateralOut *= yIncrease;
        _collateralOut += uint256(xIncrease) << 32;
        _collateralOut = _collateralOut.mulDiv(zIncrease, uint256(xIncrease) << 32);
        _collateralOut += zIncrease;
        collateralOut = _collateralOut.toUint112();
    }
}
