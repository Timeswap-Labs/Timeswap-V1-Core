// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {CallbackTest} from './CallbackTest.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {ITimeswapBorrowCallback} from '../../interfaces/callback/ITimeswapBorrowCallback.sol';
import {ITimeswapLendCallback} from '../../interfaces/callback/ITimeswapLendCallback.sol';
import {ITimeswapMintCallback} from '../../interfaces/callback/ITimeswapMintCallback.sol';
import {ITimeswapPayCallback} from '../../interfaces/callback/ITimeswapPayCallback.sol';

contract CallbackTestCallee {
    CallbackTest public immutable callbackTestContract;

    constructor(address callbackTest) {
        callbackTestContract = CallbackTest(callbackTest);
    }

    function mint(
        IERC20 asset,
        IERC20 collateral,
        uint112 assetIn,
        uint112 collateralIn,
        bytes calldata data
    ) external {
        callbackTestContract.mint(
            asset,
            collateral,
            assetIn,
            collateralIn,
            data
        );
    }

    function lend(
        IERC20 asset,
        uint112 assetIn,
        bytes calldata data
    ) external {
        callbackTestContract.lend(
            asset,
            assetIn,
            data
        );
    }

    function borrow(
        IERC20 collateral,
        uint112 collateralIn,
        bytes calldata data
    ) external {
        callbackTestContract.borrow(
            collateral,
            collateralIn,
            data
        );
    }

    function pay(
        IERC20 asset,
        uint128 assetIn,
        bytes calldata data
    ) external {
        callbackTestContract.pay(
            asset,
            assetIn,
            data
        );
    }
    
    function timeswapMintCallback(
        uint112 assetIn,
        uint112 collateralIn,
        bytes calldata data
    ) external {}

    function timeswapLendCallback(
        uint112 assetIn,
        bytes calldata data
    ) external {}

    function timeswapBorrowCallback(
        uint112 collateralIn,
        bytes calldata data
    ) external {}

    function timeswapPayCallback(
        uint128 assetIn,
        bytes calldata data
    ) external {}
}