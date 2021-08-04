// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {Math} from './Math.sol';
import {FullMath} from './FullMath.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from './SafeCast.sol';


library BorrowMath {
    using Math for uint256;
    using FullMath for uint256;
    using ConstantProduct for IPair.State;
    using SafeCast for uint256;

    function check(
        IPair.State memory state,
        uint128 assetOut,
        uint128 interestIncrease,
        uint128 cdpIncrease,
        uint16 fee
    ) internal pure {
        uint256 feeBase = 0x10000 - fee;
        uint128 assetReserve = state.reserves.asset - assetOut;
        uint128 interestAdjusted = adjust(interestIncrease, state.interest, feeBase);
        uint128 cdpAdjusted = adjust(cdpIncrease, state.cdp, feeBase);
        state.check(assetReserve, interestAdjusted, cdpAdjusted);

        uint256 minimum = assetOut;
        minimum *= state.interest;
        minimum = minimum.divUp(uint256(assetReserve) << 4);
        require(interestIncrease >= minimum, 'Invalid');
    }

    function adjust(
        uint128 increase,
        uint128 reserve,
        uint256 feeBase
    ) private pure returns (uint128 adjusted) {
        uint256 _adjusted = reserve;
        _adjusted <<= 16;
        _adjusted += feeBase * increase ;
        _adjusted >>= 16;
        adjusted = _adjusted.toUint128();
    }

    function getDebt(
        uint256 maturity,
        uint128 assetOut,
        uint128 interestIncrease
    ) internal view returns (uint112 debtOut) {
        uint256 _debtOut = maturity;
        _debtOut -= block.timestamp;
        _debtOut *= interestIncrease;
        _debtOut = _debtOut.shiftUp(32);
        _debtOut += assetOut;
        debtOut = _debtOut.toUint112();
    }

    function getCollateral(
        uint256 maturity,
        IPair.State memory state,
        uint128 assetOut,
        uint128 cdpIncrease
    ) internal view returns (uint112 collateralIn) {
        uint256 _collateralIn = maturity;
        _collateralIn -= block.timestamp;
        _collateralIn *= state.interest;
        _collateralIn = _collateralIn.shiftUp(32);
        _collateralIn += state.reserves.asset;
        uint256 denominator = state.reserves.asset;
        denominator -= assetOut;
        denominator *= state.reserves.asset;
        _collateralIn = _collateralIn.mulDiv(uint256(assetOut) * state.cdp, denominator);
        _collateralIn += cdpIncrease;
        collateralIn = _collateralIn.toUint112();
    }
}
