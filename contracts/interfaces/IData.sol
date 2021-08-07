// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

interface IData {
    struct Tokens {
        uint128 asset;
        uint128 collateral;
    }

    struct Claims {
        uint128 bond;
        uint128 insurance;
    }

    struct Due {
        uint112 debt;
        uint112 collateral;
        uint32 startBlock;
    }

    struct State {
        uint128 asset;
        uint112 interest;
        uint112 cdp;
    }

    struct Pool {
        State state;
        Tokens lock;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidities;
        Claims totalClaims;
        mapping(address => Claims) claims;
        mapping(address => Due[]) dues;
    }
}