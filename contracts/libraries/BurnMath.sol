// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {FullMath} from './FullMath.sol';
import {SafeCast} from './SafeCast.sol';

library BurnMath {
    using FullMath for uint256;
    using SafeCast for uint256;

    function getToken(
        uint256 liquidityIn,
        uint128 reserve,
        uint256 totalLiquidity
    ) internal pure returns (uint128 tokenOut) {
        uint256 _tokenOut = reserve;
        _tokenOut = _tokenOut.mulDiv(liquidityIn, totalLiquidity);
        tokenOut = _tokenOut.toUint128();
    }
}
