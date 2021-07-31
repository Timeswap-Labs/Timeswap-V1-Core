// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

interface IPair {
    struct Tokens {
        uint128 asset;
        uint128 collateral;
    }

    struct Claims {
        uint128 bond;
        uint128 insurance;
    }

    struct Debt {
        uint112 debt;
        uint112 collateral;
        uint32 startBlock;
    }

    struct Parameter {
        Tokens reserves;
        uint128 interest;
        uint128 cdp;
    }

    struct Pool {
        Parameter parameter;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidityOf;
        Claims totalClaims;
        mapping(address => Claims) claimsOf;
        mapping(address => Debt[]) debtsOf;
    }

    event Sync(uint256 maturity, Parameter parameter);

    event Mint(
        uint256 maturity,
        address indexed sender,
        address indexed liquidityTo,
        address indexed debtTo,
        uint128 assetIn,
        uint256 liquidityOut,
        uint256 id,
        Debt debtOut
    );

    event Burn(
        uint256 maturity,
        address indexed sender,
        address indexed assetTo,
        address indexed debtTo,
        uint256 liquidityIn,
        Tokens tokensOut
    );

    event Lend(
        uint256 maturity,
        address indexed sender,
        address indexed bondTo,
        address indexed insuranceTo,
        uint128 assetIn,
        Claims claimsOut
    );

    event Withdraw(
        uint256 maturity,
        address indexed sender,
        address indexed assetTo,
        address indexed collateralTo,
        Claims claimsIn,
        Tokens tokensOut
    );

    event Borrow(
        uint256 maturity,
        address indexed sender,
        address indexed assetTo,
        address indexed debtTo,
        uint128 assetOut,
        uint256 id,
        Debt debtOut
    );

    event Pay(
        uint256 maturity,
        address indexed sender,
        address indexed to,
        address indexed owner,
        uint128 assetIn,
        uint128 collateralOut,
        uint256[] ids,
        Debt[] debtsIn
    );

    event Skim(address indexed sender, address indexed assetTo, address indexed collateralTo, Tokens tokensOut);
}
