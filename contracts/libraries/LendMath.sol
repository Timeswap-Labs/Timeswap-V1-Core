// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';
import {FixedPoint16} from './FixedPoint16.sol';
import {ConstantProduct} from './ConstantProduct.sol';

library LendMath {
    using SafeCast for uint256;

    function getParameter(
        IPair.Parameter memory _parameter,
        uint128 assetIn,
        uint128 interestDecrease,
        uint128 cdpDecrease
    ) internal pure returns (IPair.Parameter memory parameter) {
        parameter.reserves.asset = _parameter.reserves.asset + assetIn;
        parameter.interest = _parameter.interest - interestDecrease;
        parameter.cdp = _parameter.cdp - cdpDecrease;
    }

    function check(
        IPair.Parameter memory parameter,
        uint128 _assetReserve,
        uint128 assetIn,
        uint128 interestDecrease,
        uint128 cdpDecrease,
        uint16 fee
    ) internal pure {
        uint256 feeBase = 0x10000 + fee;
        uint128 interestAdjusted = adjust(interestDecrease, parameter.interest, feeBase);
        uint128 cdpAdjusted = adjust(cdpDecrease, parameter.cdp, feeBase);
        ConstantProduct.check(parameter, _assetReserve, interestAdjusted, cdpAdjusted);

        uint256 minimum = assetIn;
        minimum *= parameter.interest;
        minimum /= _assetReserve;
        minimum >>= 4;
        require(interestDecrease >= minimum, 'Invalid');
    }

    function adjust(
        uint128 decrease,
        uint128 reserve,
        uint256 feeBase
    ) private pure returns (uint128 adjusted) {
        uint256 _adjusted = reserve << 16;
        _adjusted -= uint256(decrease) * feeBase;
        _adjusted >>= 16;
        adjusted = _adjusted.toUint128();
    }

    function getBond(
        uint128 assetIn,
        uint128 interestDecrease,
        uint256 duration
    ) internal pure returns (uint128 amount) {
        uint256 _amount = duration;
        _amount *= interestDecrease;
        _amount >>= 32;
        _amount += assetIn;
        amount = _amount.toUint128();
    }

    function getInsurance(
        uint128 bondOut,
        uint128 cdpDecrease,
        uint128 newAssetReserve,
        uint128 cdp
    ) internal pure returns (uint128 amount) {
        uint256 _amount = bondOut;
        _amount *= cdp;
        _amount /= newAssetReserve;
        _amount += cdpDecrease;
        amount = _amount.toUint128();
    }
}
