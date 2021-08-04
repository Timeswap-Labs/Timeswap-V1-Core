// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

library SafeCast {
    function toUint32(uint256 x) internal pure returns (uint32 y) {
        require((y = uint32(x)) == x);
    }
    
    function toUint112(uint256 x) internal pure returns (uint112 y) {
        require((y = uint112(x)) == x);
    }

    function toUint128(uint256 x) internal pure returns (uint128 y) {
        require((y = uint128(x)) == x);
    }

    function truncateUint128(uint256 x) internal pure returns (uint128 y) {
        if (x > type(uint128).max) return y = type(uint128).max;
        y = uint128(x);
    }
}
