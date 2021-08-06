// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {FullMath} from './FullMath.sol';

library ConstantProduct {
    using FullMath for uint256;

    function checkConstantProduct(
        IPair.State memory state,
        uint128 assetReserve,
        uint128 interestAdjusted,
        uint128 cdpAdjusted
    ) internal pure {
        (uint256 prod0, uint256 prod1) = (uint256(interestAdjusted) * cdpAdjusted).mul512(assetReserve);
        (uint256 _prod0, uint256 _prod1) = (uint256(state.interest) * state.cdp << 32).mul512(state.reserves.asset);

        require(prod1 >= _prod1, 'Invariance');
        if (prod1 == _prod1) require(prod0 >= _prod0, 'Invariance');
    }
}
