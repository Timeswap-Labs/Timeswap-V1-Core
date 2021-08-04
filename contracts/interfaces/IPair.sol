// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IFactory} from './IFactory.sol';
import {IERC20} from './IERC20.sol';

interface IPair {
    // STRUCT
    
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
        Tokens reserves;
        uint128 interest;
        uint128 cdp;
    }

    struct Pool {
        State state;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidities;
        Claims totalClaims;
        mapping(address => Claims) claims;
        mapping(address => Due[]) dues;
    }

    // EVENT

    event Sync(uint256 maturity, State state);

    event Mint(
        uint256 maturity,
        address indexed sender,
        address indexed liquidityTo,
        address indexed debtTo,
        uint128 assetIn,
        uint256 liquidityOut,
        uint256 id,
        Due dueOut
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
        Due dueOut
    );

    event Pay(
        uint256 maturity,
        address indexed sender,
        address indexed to,
        address indexed owner,
        uint128 assetIn,
        uint128 collateralOut,
        uint256[] ids,
        Due[] duesIn
    );

    event Skim(
        address indexed sender,
        address indexed assetTo,
        address indexed collateralTo,
        uint256 assetOut,
        uint256 collateralOut
    );

    // VIEW

    function factory() external view returns (IFactory);

    function asset() external view returns (IERC20);

    function collateral() external view returns (IERC20);

    function fee() external view returns (uint16);

    function protocolFee() external view returns (uint16);

    function totalReserves() external view returns (Tokens memory);

    function state(uint256 maturity) external view returns (State memory);

    function totalLiquidity(uint256 maturity) external view returns (uint256);

    function liquidityOf(uint256 maturity, address owner) external view returns (uint256);

    function totalClaims(uint256 maturity) external view returns (Claims memory);

    function claimsOf(uint256 maturity, address owner) external view returns (Claims memory);

    function duesOf(uint256 maturity, address owner) external view returns (Due[] memory);

    // UPDATE

    function mint(
        uint256 maturity,
        address liquidityTo,
        address dueTo,
        uint128 interestIncrease,
        uint128 cdpIncrease
    )
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            Due memory dueOut
        );

    function burn(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        uint256 liquidityIn
    ) external returns (Tokens memory tokensOut);

    function lend(
        uint256 maturity,
        address bondTo,
        address insuranceTo,
        uint128 interestDecrease,
        uint128 cdpDecrease
    ) external returns (Claims memory claimsOut);

    function withdraw(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        Claims memory claimsIn
    ) external returns (Tokens memory tokensOut);

    function borrow(
        uint256 maturity,
        address assetTo,
        address dueTo,
        uint128 assetOut,
        uint128 interestIncrease,
        uint128 cdpIncrease
    ) external returns (uint256 id, Due memory dueOut);

    function pay(
        uint256 maturity,
        address to,
        address owner,
        uint256[] memory ids,
        uint112[] memory assetsPay
    ) external returns (uint128 collateralOut);

    function skim(
        address assetTo,
        address collateralTo
    ) external returns (uint256 assetOut, uint256 collateralOut);
}
