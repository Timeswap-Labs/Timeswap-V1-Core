// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

library Math {
    function subOrZero(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x > y ? x - y : 0;
    }

    function divUp(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x / y;
        if (x != z * y) z++;
    }

    function shiftUp(uint256 x, uint8 y) internal pure returns (uint256 z) {
        z = x >> y;
        if (x != z << y) z++;
    }

    function min(
        uint256 w,
        uint256 x,
        uint256 y
    ) internal pure returns (uint256 z) {
        if (w <= x && w <= y) {
            z = w;
        } else if (x <= w && x <= y) {
            z = x;
        } else {
            z = y;
        }
    }
}
