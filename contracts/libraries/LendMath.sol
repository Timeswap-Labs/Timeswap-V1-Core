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

    //TODO: change fx to pure
    function check(
        IPair.State memory state,
        uint112 xIncrease,
        uint112 yDecrease,
        uint112 zDecrease,
        uint16 fee
    ) internal view {
        uint128 feeBase = 0x10000 + fee;
        console.log("1");
        uint112 xReserve = state.x + xIncrease;
        console.log("2");
        uint128 yAdjusted = adjust(state.y, yDecrease, feeBase);
        console.log("3");
        uint128 zAdjusted = adjust(state.z, zDecrease, feeBase);
        console.log("4");
        state.checkConstantProduct(xReserve, yAdjusted, zAdjusted);
        console.log("5");
        uint256 minimum = xIncrease;
        minimum *= state.y;
        minimum <<= 12;
        uint256 denominator = xReserve;
        denominator *= feeBase;
        minimum /= denominator;
        console.log("6");
        require(yDecrease >= minimum, 'Minimum');
        console.log("7");
    }

    //TODO: change function to pure
    function adjust(
        uint112 reserve,
        uint112 decrease,
        uint128 feeBase
    ) private view returns (uint128 adjusted) {
        uint256 _adjusted = reserve;
        console.log("adjust 1");
        _adjusted <<= 16;
        console.log("adjust 2");
        _adjusted -= uint256(feeBase) * decrease;
        console.log("adjust 3");
        adjusted = _adjusted.toUint128();
        console.log("adjust 4");
        
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
        console.log("A");
        _insuranceOut -= block.timestamp;
        console.log("D");
        _insuranceOut *= state.y;
        console.log("C");
        _insuranceOut += uint256(state.x) << 32;
        console.log("D");
        uint256 denominator = state.x;
        console.log("E");
        denominator += xIncrease;
        console.log("F");
        denominator *= uint256(state.x);
        console.log("G");
        denominator <<= 32;
        console.log("H");
        _insuranceOut = _insuranceOut.mulDiv(uint256(xIncrease) * state.z, denominator);
        console.log("I");
        _insuranceOut += zDecrease;
        console.log("J");
        insuranceOut = _insuranceOut.toUint128();
        console.log("K");
    }
}
