// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

library FixedPoint16 {
    uint8 internal constant RESOLUTION = 16;
    uint256 internal constant Q16 = 0x10000;
}
