// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from "../interfaces/IPair.sol";
import {SafeCast} from "./SafeCast.sol";
import {FixedPoint32} from "./FixedPoint32.sol";

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

    function getBond(
        uint128 assetIn,
        uint128 interestDecrease,
        uint256 duration
    ) internal pure returns (uint128 amount) {
        uint256 _amount = duration;
        _amount *= uint256(interestDecrease);
        _amount >>= FixedPoint32.RESOLUTION;
        _amount += uint256(assetIn);
        amount = _amount.toUint128();
    }

    function getInsurance(
        uint128 assetIn,
        uint128 cdpDecrease,
        uint128 newAssetReserve,
        uint128 cdp
    ) internal pure returns (uint128 amount) {
        uint256 _amount = uint256(assetIn);
        _amount *= uint256(cdp);
        _amount /= uint256(newAssetReserve);
        _amount += uint256(cdpDecrease);
        amount = _amount.toUint128();
    }
}
