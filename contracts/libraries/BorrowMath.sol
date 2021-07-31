// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';
import {Math} from './Math.sol';
import {ConstantProduct} from './ConstantProduct.sol';

library BorrowMath {
    using Math for uint256;
    using SafeCast for uint256;

    function check(
        IPair.Parameter memory parameter,
        uint128 assetOut,
        uint128 interestIncrease,
        uint128 cdpIncrease,
        uint16 fee
    ) internal pure {
        uint256 feeBase = 0x10000 - fee;
        uint128 assetReserve = parameter.reserves.asset - assetOut;
        uint128 interestAdjusted = adjust(interestIncrease, parameter.interest, feeBase);
        uint128 cdpAdjusted = adjust(cdpIncrease, parameter.cdp, feeBase);
        ConstantProduct.check(parameter, assetReserve, interestAdjusted, cdpAdjusted);

        uint256 minimum = assetOut;
        minimum *= parameter.interest;
        minimum = minimum.divUp(assetReserve);
        minimum = minimum.shiftUp(4);
        require(interestIncrease >= minimum, 'Invalid');
    }

    function adjust(
        uint128 increase,
        uint128 reserve,
        uint256 feeBase
    ) private pure returns (uint128 adjusted) {
        uint256 _adjusted = reserve << 16;
        _adjusted += uint256(increase) * feeBase;
        _adjusted >>= 16;
        adjusted = _adjusted.toUint128();
    }

    function getDebt(
        uint128 assetOut,
        uint128 interestIncrease,
        uint256 duration
    ) internal pure returns (uint112 debtOut) {
        uint256 _debtOut = duration;
        _debtOut *= interestIncrease;
        _debtOut = _debtOut.shiftUp(32);
        _debtOut += assetOut;
        debtOut = _debtOut.toUint112();
    }

    function getCollateral(
        IPair.Parameter memory parameter,
        uint128 assetIn,
        uint128 debtOut,
        uint128 cdpIncrease
    ) internal pure returns (uint112 collateralOut) {
        uint256 _collateralOut = debtOut;
        _collateralOut *= parameter.cdp;
        _collateralOut = _collateralOut.divUp(parameter.reserves.asset - assetIn);
        _collateralOut += cdpIncrease;
        collateralOut = _collateralOut.toUint112();
    }
}
