// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.8.4;

library BlockNumber {
    function get() internal view returns (uint32 blockNumber) {
        // can overflow
        blockNumber = uint32(block.number);
    }
}