// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';

library BurnMath {
    using SafeCast for uint256;

    function getToken(
        uint256 liquidityIn,
        uint128 reserve,
        uint256 totalLiquidity
    ) internal pure returns (uint128 tokenOut) {
        uint256 _tokenOut = reserve;
        _tokenOut *= liquidityIn; // implement mulDiv
        _tokenOut /= totalLiquidity;
        tokenOut = _tokenOut.toUint128();
    }
}
