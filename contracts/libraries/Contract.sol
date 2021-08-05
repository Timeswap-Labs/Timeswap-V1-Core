// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

library Contract {
    function requireContract(address target) internal view {
        uint256 size;
        assembly { size := extcodesize(target) }
        require(size > 0, 'Forbidden');
    }
}