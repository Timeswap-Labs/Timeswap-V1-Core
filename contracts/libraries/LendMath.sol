// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';
import {ConstantProduct} from './ConstantProduct.sol';

library LendMath {
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
        ConstantProduct.check(state, assetReserve, interestAdjusted, cdpAdjusted);

        uint256 minimum = assetIn;
        minimum *= state.interest;
        minimum /= assetReserve;
        minimum >>= 4;
        require(interestDecrease >= minimum, 'Invalid');
    }

    function adjust(
        uint128 decrease,
        uint128 reserve,
        uint256 feeBase
    ) private pure returns (uint128 adjusted) {
        uint256 _adjusted = reserve;
        _adjusted <<= 16;
        _adjusted -= uint256(decrease) * feeBase;
        _adjusted >>= 16;
        adjusted = _adjusted.toUint128();
    }

    function getBond(
        uint128 assetIn,
        uint128 interestDecrease,
        uint256 duration
    ) internal pure returns (uint128 bondOut) {
        uint256 _bondOut = duration;
        _bondOut *= interestDecrease;
        _bondOut >>= 32;
        _bondOut += assetIn;
        bondOut = _bondOut.toUint128();
    }

    function getInsurance(
        IPair.State memory state,
        uint128 assetIn,
        uint128 bondOut,
        uint128 cdpDecrease
    ) internal pure returns (uint128 insuranceOut) {
        uint256 _insuranceOut = bondOut;
        _insuranceOut *= state.cdp;
        _insuranceOut /= state.reserves.asset + assetIn;
        _insuranceOut += cdpDecrease;
        insuranceOut = _insuranceOut.toUint128();
    }
}
