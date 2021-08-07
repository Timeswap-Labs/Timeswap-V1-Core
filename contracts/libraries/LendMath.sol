// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IData} from '../interfaces/IData.sol';
import {FullMath} from './FullMath.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from './SafeCast.sol';

library LendMath {
    using FullMath for uint256;
    using ConstantProduct for IData.State;
    using SafeCast for uint256;

    function check(
        IData.State memory state,
        uint128 assetIn,
        uint112 interestDecrease,
        uint112 cdpDecrease,
        uint16 fee
    ) internal pure {
        uint128 feeBase = 0x10000 + fee;
        uint128 assetReserve = state.asset + assetIn;
        uint128 interestAdjusted = adjust(interestDecrease, state.interest, feeBase);
        uint128 cdpAdjusted = adjust(cdpDecrease, state.cdp, feeBase);
        state.checkConstantProduct(assetReserve, interestAdjusted, cdpAdjusted);

        uint256 minimum = assetIn;
        minimum *= state.interest;
        minimum /= uint256(assetReserve) << 4;
        require(interestDecrease >= minimum, 'Invalid');
    }

    function adjust(
        uint112 decrease,
        uint112 reserve,
        uint128 feeBase
    ) private pure returns (uint128 adjusted) {
        adjusted = reserve;
        adjusted <<= 16;
        adjusted -= feeBase * decrease;
    }

    function getBond(
        uint256 maturity,
        uint128 assetIn,
        uint112 interestDecrease
    ) internal view returns (uint128 bondOut) {
        uint256 _bondOut = maturity;
        _bondOut -= block.timestamp;
        _bondOut *= interestDecrease;
        _bondOut >>= 32;
        _bondOut += assetIn;
        bondOut = _bondOut.toUint128();
    }

    function getInsurance(
        uint256 maturity,
        IData.State memory state,
        uint128 assetIn,
        uint112 cdpDecrease
    ) internal view returns (uint128 insuranceOut) {
        uint256 _insuranceOut = maturity;
        _insuranceOut -= block.timestamp;
        _insuranceOut *= state.interest;
        _insuranceOut += uint256(state.asset) << 32;
        uint256 denominator = state.asset;
        denominator += assetIn;
        denominator *= uint256(state.asset) << 32;
        _insuranceOut = _insuranceOut.mulDiv(uint256(assetIn) * state.cdp, denominator);
        _insuranceOut += cdpDecrease;
        insuranceOut = _insuranceOut.toUint128();
    }
}
