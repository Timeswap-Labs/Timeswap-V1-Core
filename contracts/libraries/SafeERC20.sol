// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from '../interfaces/IERC20.sol';
import {SafeCast} from './SafeCast.sol';

library SafeERC20 {
    using SafeCast for uint256;

    function getTokenIn(
        IERC20 token,
        uint128 reserve
    ) internal view returns (uint128 tokenIn) {
        tokenIn = (token.balanceOf(address(this)) - reserve).toUint128();
    }
    
    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        (bool success, bytes memory data) =
            address(token).call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    }
}