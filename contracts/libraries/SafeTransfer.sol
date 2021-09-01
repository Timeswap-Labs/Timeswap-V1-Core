// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {Contract} from './Contract.sol';

library SafeTransfer {
    using Contract for address;

    function safeTransfer(
        IERC20 token,
        address to,
        uint256 amount
    ) internal {
        address(token).requireContract;
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    }
}
