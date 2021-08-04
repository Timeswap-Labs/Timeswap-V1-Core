// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {FullMath} from './FullMath.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from './SafeCast.sol';

library LendMath {
    using FullMath for uint256;
    using ConstantProduct for IPair.State;
    using SafeCast for uint256;

    function check(
        IPair.State memory state,
        uint128 assetIn,
        uint128 interestDecrease,
        uint128 cdpDecrease,
        uint16 fee
    ) internal pure {
        uint256 feeBase = 0x10000 + fee;
        uint128 assetReserve = state.reserves.asset + assetIn;
        uint128 interestAdjusted = adjust(interestDecrease, state.interest, feeBase);
        uint128 cdpAdjusted = adjust(cdpDecrease, state.cdp, feeBase);
        state.check(assetReserve, interestAdjusted, cdpAdjusted);

        uint256 minimum = assetIn;
        minimum *= state.interest;
        minimum /= uint256(assetReserve) << 4;
        require(interestDecrease >= minimum, 'Invalid');
    }

    function adjust(
        uint128 decrease,
        uint128 reserve,
        uint256 feeBase
    ) private pure returns (uint128 adjusted) {
        uint256 _adjusted = reserve;
        _adjusted <<= 16;
        _adjusted -= feeBase * decrease;
        _adjusted >>= 16;
        adjusted = _adjusted.toUint128();
    }

    function getBond(
        uint256 maturity,
        uint128 assetIn,
        uint128 interestDecrease
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
        IPair.State memory state,
        uint128 assetIn,
        uint128 cdpDecrease
    ) internal view returns (uint128 insuranceOut) {
        uint256 _insuranceOut = maturity;
        _insuranceOut -= block.timestamp;
        _insuranceOut *= state.interest;
        _insuranceOut >>= 32;
        _insuranceOut += state.reserves.asset;
        uint256 denominator = state.reserves.asset;
        denominator += assetIn;
        denominator *= state.reserves.asset << 32;
        _insuranceOut = _insuranceOut.mulDiv(uint256(assetIn) * state.cdp, denominator);
        _insuranceOut += cdpDecrease;
        insuranceOut = _insuranceOut.toUint128();
    }
}
