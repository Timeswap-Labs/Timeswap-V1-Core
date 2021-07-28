// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

library Math {
    function subOrZero(
        uint256 x,
        uint256 y
    ) internal pure returns (uint256 z) {
        z = x > y ? x - y : 0;
    }
}