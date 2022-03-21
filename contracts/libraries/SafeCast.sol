// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.8.4;

library SafeCast {    
    function toUint112(uint256 x) internal pure returns (uint112 y) {
        require(x <= type(uint112).max);
        y = uint112(x);
    }

    function toUint128(uint256 x) internal pure returns (uint128 y) {
        require(x <= type(uint128).max);
        y = uint128(x);
    }

    function truncateUint112(uint256 x) internal pure returns (uint112 y) {
        if (x > type(uint112).max) return y = type(uint112).max;
        y = uint112(x);
    }
}
