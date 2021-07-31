// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {SafeCast} from './SafeCast.sol';
import {Math} from './Math.sol';

library MintMath {
    using Math for uint256;
    using SafeCast for uint256;

    function getDebt(
        uint128 assetIn,
        uint128 interestIncrease,
        uint256 duration
    ) internal pure returns (uint112 debtOut) {
        uint256 _debtOut = duration;
        _debtOut *= interestIncrease;
        _debtOut = _debtOut.shiftUp(32);
        _debtOut += assetIn;
        debtOut = _debtOut.toUint112();
    }

    function getCollateral(
        uint128 assetIn,
        uint128 debtOut,
        uint128 cdpIncrease
    ) internal pure returns (uint112 collateralOut) {
        uint256 _collateralOut = debtOut;
        _collateralOut *= cdpIncrease;
        _collateralOut = _collateralOut.divUp(assetIn);
        _collateralOut += cdpIncrease;
        collateralOut = _collateralOut.toUint112();
    }
}
