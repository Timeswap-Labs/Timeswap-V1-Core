// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {BlockNumber} from '../../libraries/BlockNumber.sol';

library BlockNumberTest {
    function get() external view returns (uint32 blockNumber) {
        return BlockNumber.get();
    }
}