// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IData} from '../interfaces/IData.sol';
import {Math} from './Math.sol';
import {FullMath} from './FullMath.sol';
import {SafeCast} from './SafeCast.sol';

library MintMath {
    using Math for uint256;
    using FullMath for uint256;
    using SafeCast for uint256;

    function getLiquidityTotal(
        uint128 assetIn
    ) internal pure returns (uint256 liquidityTotal) {
        liquidityTotal = assetIn;
        liquidityTotal <<= 40;
    }

    function getLiquidityTotal(
        IData.State memory state,
        uint128 assetIn,
        uint112 interestIncrease,
        uint112 cdpIncrease,
        uint256 total
    ) internal pure returns (uint256 liquidityTotal) {
        liquidityTotal = min(
            total.mulDiv(assetIn, state.asset),
            total.mulDiv(interestIncrease, state.interest),
            total.mulDiv(cdpIncrease, state.cdp)
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
        uint128 assetIn,
        uint112 interestIncrease
    ) internal view returns (uint112 debtOut) {
        uint256 _debtOut = maturity;
        _debtOut -= block.timestamp;
        _debtOut *= interestIncrease;
        _debtOut = _debtOut.shiftUp(32);
        _debtOut += assetIn;
        debtOut = _debtOut.toUint112();
    }

    function getCollateral(
        uint256 maturity,
        uint128 assetIn,
        uint112 interestIncrease,
        uint112 cdpIncrease
    ) internal view returns (uint112 collateralOut) {
        uint256 _collateralOut = maturity;
        _collateralOut -= block.timestamp;
        _collateralOut *= interestIncrease;
        _collateralOut += uint256(assetIn) << 32;
        _collateralOut = _collateralOut.mulDiv(cdpIncrease, uint256(assetIn) << 32);
        _collateralOut += cdpIncrease;
        collateralOut = _collateralOut.toUint112();
    }
}
