// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {Math} from '../../libraries/Math.sol';

contract MathTest {
    function divUp(uint256 x, uint256 y) external pure returns (uint256 z) {
        return Math.divUp(x, y);
    }

    function shiftUp(uint256 x, uint8 y) external pure returns (uint256 z) {
        return Math.shiftUp(x, y);
    }
}