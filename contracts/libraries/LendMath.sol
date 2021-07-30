// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';

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

    function checkInterest(
        uint128 assetIn,
        uint128 interestDecrease,
        uint128 newAssetReserve,
        uint128 interest
    ) internal pure {
        uint256 minimum = assetIn;
        minimum *= interest;
        minimum /= newAssetReserve;
        minimum >>= 4;
        require(interestDecrease >= minimum, 'Invalid');
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
