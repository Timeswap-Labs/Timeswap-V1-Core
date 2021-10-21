// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {IPair} from '../interfaces/IPair.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {ITimeswapBorrowCallback} from '../interfaces/callback/ITimeswapBorrowCallback.sol';
import {ITimeswapLendCallback} from '../interfaces/callback/ITimeswapLendCallback.sol';
import {ITimeswapMintCallback} from '../interfaces/callback/ITimeswapMintCallback.sol';
import {ITimeswapPayCallback} from '../interfaces/callback/ITimeswapPayCallback.sol';


contract TimeswapPairCallee {
    IPair public immutable  pairContract;
    IFactory public immutable  factoryContract;

    constructor(address pair) {
        pairContract = IPair(pair);
        factoryContract = IPair(pair).factory();
    }
    
    struct PairCalleeInfo {
        IERC20 asset;
        IERC20 collateral;
        address from;
    }
    struct PairCalleeInfoMint {
        IERC20 asset;
        IERC20 collateral;
        address assetFrom;
        address collateralFrom;
    }

    function getData(address from) public view returns (bytes memory data) {
        data = abi.encode(PairCalleeInfo(pairContract.asset(),pairContract.collateral(),from));
    }

    function getDataMint(address from) public view returns (bytes memory data){
        data =  abi.encode(PairCalleeInfoMint(pairContract.asset(),pairContract.collateral(),from,from));
    }

    function mint(
        uint256 maturity,
        address liquidityTo,
        uint112 xIncrease,
        uint112 yIncrease,
        uint112 zIncrease
    )
        external 
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        return pairContract.mint(
            maturity,
            liquidityTo,
            address(this),
            xIncrease,
            yIncrease,
            zIncrease,getDataMint(msg.sender)
        );
    }

    function lend(
        uint256 maturity,
        address bondTo,
        address insuranceTo,
        uint112 xIncrease,
        uint112 yDecrease,
        uint112 zDecrease
    ) external returns (IPair.Claims memory claimsOut){
        return pairContract.lend(
            maturity,
            bondTo,
            insuranceTo,
            xIncrease,
            yDecrease,
            zDecrease,
            getData(msg.sender)
        );
    }

    function borrow(
        uint256 maturity,
        address assetTo,
        address dueTo,
        uint112 xDecrease,
        uint112 yIncrease,
        uint112 zIncrease
    ) external returns (uint256 id, IPair.Due memory dueOut){
        return pairContract.borrow(
            maturity,
            assetTo,
            dueTo,
            xDecrease,
            yIncrease,
            zIncrease,
            getData(msg.sender)
        );
    }

    function pay(
        uint256 maturity,
        address to,
        address owner,
        uint256[] memory ids,
        uint112[] memory assetsIn,
        uint112[] memory collateralsOut
    ) external returns (uint128 assetIn, uint128 collateralOut){
        return pairContract.pay(
            maturity,
            to,
            owner,
            ids,
            assetsIn,
            collateralsOut,
            getData(msg.sender)
        );
    }

    function timeswapMintCallback(
        uint112 assetIn,
        uint112 collateralIn,
        bytes calldata data
    ) external {
        (IERC20 asset, IERC20 collateral, address assetFrom, address collateralFrom) = abi.decode(
            data,
            (IERC20, IERC20, address, address)
        );
        IPair pair = factoryContract.getPair(asset, collateral);

        require(msg.sender == address(pair), 'Invalid sender');
        asset.transferFrom(assetFrom, address(pair), assetIn);
        collateral.transferFrom(collateralFrom, address(pair), collateralIn);
    }

    function timeswapLendCallback(uint112 assetIn, bytes calldata data) external {
        (IERC20 asset, IERC20 collateral, address from) = abi.decode(
            data,
            (IERC20, IERC20, address)
        );
        IPair pair = factoryContract.getPair(asset, collateral);

        require(msg.sender == address(pair), 'Invalid sender');
        asset.transferFrom(from, address(pair), assetIn);
    }

    function timeswapBorrowCallback(uint112 collateralIn, bytes calldata data) external {
        (IERC20 asset, IERC20 collateral, address from) = abi.decode(
            data,
            (IERC20, IERC20, address)
        );
        IPair pair = factoryContract.getPair(asset, collateral);

        require(msg.sender == address(pair), 'Invalid sender');
        collateral.transferFrom(from, address(pair), collateralIn);
    }
    
    function timeswapPayCallback(
        uint128 assetIn,
        bytes calldata data
    ) external {
        (IERC20 asset, IERC20 collateral, address from) = abi.decode(
            data,
            (IERC20, IERC20, address)
        );
        IPair pair = factoryContract.getPair(asset, collateral);
        asset.transferFrom(from, address(pair), assetIn);
        
    }
}