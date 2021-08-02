// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from '../interfaces/IERC20.sol';

library SafeTransfer {
    function safeTransfer(
        IERC20 token,
        address to,
        uint256 amount
    ) internal {
        requireContract(address(token));
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    }

    function requireContract(address target) private view {
        uint256 size;
        assembly { size := extcodesize(target) }
        require(size > 0, 'Forbidden');
    }
}
