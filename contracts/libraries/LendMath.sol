// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {FullMath} from './FullMath.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from './SafeCast.sol';
import 'hardhat/console.sol';

library LendMath {
    using FullMath for uint256;
    using ConstantProduct for IPair.State;
    using SafeCast for uint256;

    //TODO: change to pure
    function check(
        IPair.State memory state,
        uint112 xIncrease,
        uint112 yDecrease,
        uint112 zDecrease,
        uint16 fee
    ) internal view {
        uint128 feeBase = 0x10000 + fee;
        uint112 xReserve = state.x + xIncrease;
        console.log("A");
        console.log(yDecrease, state.y);
        console.log(yDecrease<state.y);
        uint128 yAdjusted = adjust(state.y, yDecrease, feeBase);
        console.log("B");
        console.log(zDecrease, state.z);
        uint128 zAdjusted = adjust(state.z, zDecrease, feeBase);
        console.log("C");
        state.checkConstantProduct(xReserve, yAdjusted, zAdjusted);
        console.log("D");
        uint256 minimum = xIncrease;
        console.log("1");
        minimum *= state.y;
        console.log("2");
        minimum <<= 12;
        console.log("3");
        uint256 denominator = xReserve;
        console.log("4");
        denominator *= feeBase;
        console.log("5");
        minimum /= denominator;
        console.log("6");
        require(yDecrease >= minimum, 'Minimum');
    }

    //TODO: change to pure
    function adjust(
        uint112 reserve,
        uint112 decrease,
        uint128 feeBase
    ) private view returns (uint128 adjusted) {
        uint256 _adjusted = reserve;
        console.log("1.1");
        _adjusted <<= 16;
        console.log("1.2");
        console.log(_adjusted);
        console.log(uint256(feeBase) * decrease);
        console.log(_adjusted>(uint256(feeBase) * decrease));
        _adjusted -= uint256(feeBase) * decrease;
        console.log("_adjusted", "1.2.1");
        adjusted = _adjusted.toUint128();
        console.log("1.3");
    }

    function getBond(
        uint256 maturity,
        uint112 xIncrease,
        uint112 yDecrease
    ) internal view returns (uint128 bondOut) {
        uint256 _bondOut = maturity;
        _bondOut -= block.timestamp;
        _bondOut *= yDecrease;
        _bondOut >>= 32;
        _bondOut += xIncrease;
        bondOut = _bondOut.toUint128();
    }

    function getInsurance(
        uint256 maturity,
        IPair.State memory state,
        uint112 xIncrease,
        uint112 zDecrease
    ) internal view returns (uint128 insuranceOut) {
        uint256 _insuranceOut = maturity;
        _insuranceOut -= block.timestamp;
        _insuranceOut *= state.y;
        _insuranceOut += uint256(state.x) << 32;
        uint256 denominator = state.x;
        denominator += xIncrease;
        denominator *= uint256(state.x);
        denominator <<= 32;
        _insuranceOut = _insuranceOut.mulDiv(uint256(xIncrease) * state.z, denominator);
        _insuranceOut += zDecrease;
        insuranceOut = _insuranceOut.toUint128();
    }
}
