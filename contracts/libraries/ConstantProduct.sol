// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {FullMath} from './FullMath.sol';

library ConstantProduct {
    using FullMath for uint256;

    function check(
        IPair.State memory state,
        uint128 assetReserve,
        uint128 interestAdjusted,
        uint128 cdpAdjusted
    ) internal pure {
        (uint256 prod0, uint256 prod1) = (uint256(interestAdjusted) * cdpAdjusted).mul512(assetReserve);
        (uint256 _prod0, uint256 _prod1) = (uint256(state.interest) * state.cdp).mul512(state.reserves.asset);

        require(prod1 >= _prod1, 'Invariance');
        if (prod1 == _prod1) require(prod0 >= _prod0, 'Invariance');
    }

    function mul512(uint256 a, uint256 b) private pure returns (uint256 prod0, uint256 prod1) {
        // 512-bit multiply [prod1 prod0] = a * b
        // Compute the product mod 2**256 and mod 2**256 - 1
        // then use the Chinese Remainder Theorem to reconstruct
        // the 512 bit result. The result is stored in two 256
        // variables such that product = prod1 * 2**256 + prod0
        assembly {
            let mm := mulmod(a, b, not(0))
            prod0 := mul(a, b)
            prod1 := sub(sub(mm, prod0), lt(mm, prod0))
        }
    }
}
