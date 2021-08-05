// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from '../interfaces/IERC20.sol';
import {Contract} from './Contract.sol';

library SafeBalance {
    using Contract for address;

    function safeBalance(
        IERC20 token
    ) internal view returns (uint256) {
    (bool success, bytes memory data) =
        address(token).staticcall(abi.encodeWithSelector(IERC20.balanceOf.selector, address(this)));
        require(success && data.length >= 32);
        return abi.decode(data, (uint256));
    }
}