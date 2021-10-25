// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

library Math {
    function divUp(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x / y;
        if (x % y > 0) z++;
    }

    function shiftRightUp(uint256 x, uint8 y) internal pure returns (uint256 z) {
        z = x >> y;
        if (x != z << y) z++;
    }

    /**
      * @dev Compute the largest integer smaller than or equal to the cubic root of `n`
    */
    function cbrt(uint256 n) internal pure returns (uint256 x) { 
        unchecked {
            for (uint256 y = 1 << 255; y > 0; y >>= 3) {
                x <<= 1;
                uint256 z = 3 * x * (x + 1) + 1;
                if (n / y >= z) {
                    n -= y * z;
                    x += 1;
                }
            }
        }
    }
}
