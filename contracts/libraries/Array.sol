// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import "hardhat/console.sol";

library Array {
    function insert(IPair.Due[] storage dues, IPair.Due memory dueOut) internal returns (uint256 id) {
        id = dues.length;   
        console.log('before push',id);
        dues.push(dueOut);
        console.log('after push',dues.length);
    }
}