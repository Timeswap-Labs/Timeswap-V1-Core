// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {ITimeswapBorrowCallback} from '../interfaces/callback/ITimeswapBorrowCallback.sol';
import {ITimeswapLendCallback} from '../interfaces/callback/ITimeswapLendCallback.sol';
import {ITimeswapMintCallback} from '../interfaces/callback/ITimeswapMintCallback.sol';
import {ITimeswapPayCallback} from '../interfaces/callback/ITimeswapPayCallback.sol';
import "hardhat/console.sol";

contract TimeswapPairCallee {

    IPair public immutable  pairContract;
    IFactory public immutable  factoryContract;
    constructor(address pair){
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

    function getData(address from) public returns(bytes memory data) {
            data = abi.encode(PairCalleeInfo(pairContract.asset(),pairContract.collateral(),from));
    }

    function getDataMint(address from) public returns(bytes memory data){
        data =  abi.encode(PairCalleeInfoMint(pairContract.asset(),pairContract.collateral(),from,from));
    }
    function factory() external  view returns (IFactory){
        return pairContract.factory();
    }

    function asset() external  view returns (IERC20){
        return pairContract.asset();
    }
    function collateral() external  view returns (IERC20){
        return pairContract.collateral();
    }
    function fee() external  view returns (uint16){
        return pairContract.fee();
    }
    function protocolFee() external  view returns (uint16){
        return pairContract.protocolFee();
    }
    function constantProduct(uint256 maturity) external  view returns (uint112 x, uint112 y, uint112 z){
        return pairContract.constantProduct(maturity);
    }
    function totalReserves(uint256 maturity) external  view returns (IPair.Tokens memory){
        return pairContract.totalReserves(maturity);
    }

    function totalLiquidity(uint256 maturity) external  view returns (uint256){
        return pairContract.totalLiquidity(maturity);
    }
    function liquidityOf(uint256 maturity, address owner) external  view returns (uint256){
        return pairContract.liquidityOf(maturity, owner);
    }
    function totalClaims(uint256 maturity) external  view returns (IPair.Claims memory){
        return pairContract.totalClaims(maturity);
    }

    function claimsOf(uint256 maturity, address owner) external  view returns (IPair.Claims memory){
        return  pairContract.claimsOf(maturity, owner);
    }
    function totalDebtCreated(uint256 maturity) external  view returns (uint120){
        return pairContract.totalDebtCreated(maturity);
    }

    function duesOf(uint256 maturity, address owner) external  view returns (IPair.Due[] memory){
        return pairContract.duesOf(maturity,owner);
    }

        function mint(
        uint256 maturity,
        address liquidityTo,
        address dueTo,
        uint112 xIncrease,
        uint112 yIncrease,
        uint112 zIncrease
    )
        external 
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        ){
            return pairContract.mint(maturity, liquidityTo,dueTo,xIncrease,yIncrease,zIncrease,getDataMint(msg.sender));
        }

    function burn(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        uint256 liquidityIn
    ) external  returns (IPair.Tokens memory tokensOut){
        
        return pairContract.burn(maturity,assetTo,collateralTo,liquidityIn);
    }
    function lend(
        uint256 maturity,
        address bondTo,
        address insuranceTo,
        uint112 xIncrease,
        uint112 yDecrease,
        uint112 zDecrease
    ) external  returns (IPair.Claims memory claimsOut){
        return pairContract.lend(maturity, bondTo, insuranceTo, xIncrease, yDecrease, zDecrease, getData(msg.sender));
    }

    function withdraw(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        IPair.Claims memory claimsIn
    ) external  returns (IPair.Tokens memory tokensOut){
        return pairContract.withdraw(maturity,assetTo,collateralTo,claimsIn);
    }

    function borrow(
        uint256 maturity,
        address assetTo,
        address dueTo,
        uint112 xDecrease,
        uint112 yIncrease,
        uint112 zIncrease
    ) external  returns (uint256 id, IPair.Due memory dueOut){
        return pairContract.borrow(maturity,assetTo,dueTo,xDecrease,yIncrease,zIncrease,getData(msg.sender));
    }
    function pay(
        uint256 maturity,
        address to,
        address owner,
        uint256[] memory ids,
        uint112[] memory assetsIn,
        uint112[] memory collateralsOut
    ) external  returns (uint128 assetIn, uint128 collateralOut){
        return pairContract.pay(maturity,to,owner,ids,assetsIn,collateralsOut,getData(msg.sender));
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

    function timeswapLendCallback(uint112 assetIn, bytes calldata data) external{
        (IERC20 asset, IERC20 collateral, address from) = abi.decode(data, (IERC20, IERC20, address));
        IPair pair = factoryContract.getPair(asset, collateral);

        require(msg.sender == address(pair), 'Invalid sender');
        asset.transferFrom(from, address(pair), assetIn);
    }

    function timeswapBorrowCallback(uint112 collateralIn, bytes calldata data) external {
        (IERC20 asset, IERC20 collateral, address from) = abi.decode(data, (IERC20, IERC20, address));
        IPair pair = factoryContract.getPair(asset, collateral);

        require(msg.sender == address(pair), 'Invalid sender');
        collateral.transferFrom(from, address(pair), collateralIn);
    }
    

    function collateralizedDebtCallback(
        IPair pair,
        uint256 maturity,
        uint128 assetIn,
        bytes calldata data
    ) external  {
        (IERC20 asset, IERC20 collateral, address from) = abi.decode(data, (IERC20, IERC20, address));

        asset.transferFrom(from, address(pair), assetIn);

    }
}