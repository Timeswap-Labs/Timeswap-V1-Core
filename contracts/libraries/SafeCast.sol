// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

library SafeCast {
    function toUint128(
        uint256 x
    ) internal pure returns (uint128 y) {
        require((y = uint128(x)) == x);
    }
}