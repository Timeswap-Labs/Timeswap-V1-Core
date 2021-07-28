// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

interface IPair {
    struct Tokens {
        uint128 asset;
        uint128 collateral;
    }

    struct Parameter {
        Tokens reserves;
        uint128 interest;
        uint128 cdp;
    }

    struct Liquidity {
        uint256 supply;
        mapping(address => uint256) balance;
    }

    struct Bond {
        Tokens supplies;
        mapping(address => Tokens) balances;
    }

    struct Debt {
        mapping(address => Tokens[]) balances;
    }

    struct Pool {
        Parameter parameter;
        Liquidity liquidity;
        Bond bond;
        Debt debt;
    }

    event Sync(uint256 maturity, Parameter parameter);

    event Lend(
        uint256 maturity,
        address indexed sender,
        address indexed to,
        uint256 assetIn,
        Tokens amount
    );

    event Withdraw(
        uint256 maturity,
        address indexed sender,
        address indexed to,
        Tokens tokensIn,
        Tokens amount
    );
}
