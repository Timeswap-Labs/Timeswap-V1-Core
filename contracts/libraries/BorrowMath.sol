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
        minimum = minimum.divUp(assetReserve << 4);
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
        uint128 assetOut,
        uint128 interestIncrease,
        uint256 maturity
    ) internal view returns (uint112 debtOut) {
        uint256 _debtOut = maturity;
        _debtOut -= block.timestamp;
        _debtOut *= interestIncrease;
        _debtOut = _debtOut.shiftUp(32);
        _debtOut += assetOut;
        debtOut = _debtOut.toUint112();
    }

    function getCollateral(
        IPair.State memory state,
        uint128 assetOut,
        uint128 cdpIncrease,
        uint256 maturity
    ) internal view returns (uint112 collateralOut) {
        uint256 _collateralOut = maturity;
        _collateralOut -= block.timestamp;
        _collateralOut *= state.interest;
        _collateralOut = _collateralOut.shiftUp(32);
        _collateralOut += state.reserves.asset;
        uint256 denominator = state.reserves.asset;
        denominator -= assetOut;
        denominator *= state.reserves.asset;
        _collateralOut = _collateralOut.mulDiv(uint256(assetOut) * state.cdp, denominator);
        _collateralOut += cdpIncrease;
        collateralOut = _collateralOut.toUint112();
    }
}
