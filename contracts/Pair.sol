// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from './interfaces/IPair.sol';
import {IFactory} from './interfaces/IFactory.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {Math} from './libraries/Math.sol';
import {MintMath} from './libraries/MintMath.sol';
import {BurnMath} from './libraries/BurnMath.sol';
import {LendMath} from './libraries/LendMath.sol';
import {WithdrawMath} from './libraries/WithdrawMath.sol';
import {BorrowMath} from './libraries/BorrowMath.sol';
import {PayMath} from './libraries/PayMath.sol';
import {SafeCast} from './libraries/SafeCast.sol';
import {SafeTransfer} from './libraries/SafeTransfer.sol';
import {Receive} from './libraries/Receive.sol';

contract Pair is IPair {
    using Math for uint256;
    using SafeCast for uint256;
    using SafeTransfer for IERC20;
    using Receive for IERC20;

    IFactory public immutable override factory;
    IERC20 public immutable override asset;
    IERC20 public immutable override collateral;
    uint16 public immutable override fee;
    uint16 public immutable override protocolFee;

    Tokens private reserves;
    mapping(uint256 => Pool) private pools;

    uint256 private locked;

    modifier lock() {
        require(locked == 0, 'Reentrancy');
        locked = 1;
        _;
        locked = 0;
    }

    constructor(
        IERC20 _asset,
        IERC20 _collateral,
        uint16 _fee,
        uint16 _protocolFee
    ) {
        factory = IFactory(msg.sender);
        asset = _asset;
        collateral = _collateral;
        fee = _fee;
        protocolFee = _protocolFee;
    }

    function mint(
        uint256 maturity,
        address liquidityTo,
        address debtTo,
        uint128 interestIncrease,
        uint128 cdpIncrease
    )
        external
        override
        lock
        returns (
            uint256 liquidityOut,
            uint256 id,
            Debt memory debtOut
        )
    {
        require(block.timestamp < maturity, 'Expired');
        require(liquidityTo != address(0) && debtTo != address(0), 'Zero');
        require(interestIncrease > 0 && cdpIncrease > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        uint128 assetIn = asset.getAssetIn(reserves);
        require(assetIn > 0, 'Invalid');

        if (pool.totalLiquidity == 0) {
            liquidityOut = assetIn - 1000;
            pool.totalLiquidity = assetIn;
        } else {
            uint256 total = pool.totalLiquidity;
            liquidityOut = Math.min(
                (total * assetIn) / pool.state.reserves.asset,
                (total * interestIncrease) / pool.state.interest,
                (total * cdpIncrease) / pool.state.cdp
            );
            pool.totalLiquidity += liquidityOut;
        }

        pool.liquidityOf[liquidityTo] += liquidityOut;

        debtOut.debt = MintMath.getDebt(assetIn, interestIncrease, block.timestamp - maturity);
        debtOut.collateral = MintMath.getCollateral(assetIn, debtOut.debt, cdpIncrease);
        debtOut.startBlock = uint32(block.number);

        uint128 collateralIn = collateral.getCollateralIn(reserves);
        require(collateralIn >= debtOut.collateral, 'Insufficient');

        Debt[] storage debts = pool.debtsOf[debtTo];

        id = debts.length;
        debts.push(debtOut);

        pool.state.reserves.asset += assetIn;
        pool.state.reserves.collateral += collateralIn;
        pool.state.interest += interestIncrease;
        pool.state.cdp += cdpIncrease;

        emit Sync(maturity, pool.state);
        emit Mint(maturity, msg.sender, liquidityTo, debtTo, assetIn, liquidityOut, id, debtOut);
    }

    function burn(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        uint256 liquidityIn
    ) external override lock returns (Tokens memory tokensOut) {
        require(block.timestamp >= maturity, 'Active');
        require(assetTo != address(0) && collateralTo != address(0), 'Zero');
        require(liquidityIn > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        uint256 total = pool.totalLiquidity;

        tokensOut.asset = BurnMath.getToken(liquidityIn, pool.state.reserves.asset, total);
        tokensOut.collateral = BurnMath.getToken(liquidityIn, pool.state.reserves.collateral, total);

        pool.totalLiquidity -= liquidityIn;

        pool.liquidityOf[msg.sender] -= liquidityIn;

        pool.state.reserves.asset -= tokensOut.asset;
        pool.state.reserves.collateral -= tokensOut.collateral;

        reserves.asset -= tokensOut.asset;
        reserves.collateral -= tokensOut.collateral;

        if (tokensOut.asset > 0 && assetTo != address(this)) asset.safeTransfer(assetTo, tokensOut.asset);
        if (tokensOut.collateral > 0 && collateralTo != address(this))
            collateral.safeTransfer(collateralTo, tokensOut.collateral);

        emit Sync(maturity, pool.state);
        emit Burn(maturity, msg.sender, assetTo, collateralTo, liquidityIn, tokensOut);
    }

    function lend(
        uint256 maturity,
        address bondTo,
        address insuranceTo,
        uint128 interestDecrease,
        uint128 cdpDecrease
    ) external override lock returns (Claims memory claimsOut) {
        require(block.timestamp < maturity, 'Expired');
        require(bondTo != address(0) && insuranceTo != address(0), 'Zero');
        require(interestDecrease > 0 || cdpDecrease > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        uint128 assetIn = asset.getAssetIn(reserves);
        require(assetIn > 0, 'Invalid');

        LendMath.check(pool.state, assetIn, interestDecrease, cdpDecrease, fee);

        claimsOut.bond = LendMath.getBond(assetIn, interestDecrease, block.timestamp - maturity);
        claimsOut.insurance = LendMath.getInsurance(pool.state, assetIn, claimsOut.bond, cdpDecrease);

        pool.totalClaims.bond += claimsOut.bond;
        pool.totalClaims.insurance += claimsOut.insurance;

        pool.claimsOf[bondTo].bond += claimsOut.bond;
        pool.claimsOf[insuranceTo].insurance += claimsOut.insurance;

        pool.state.reserves.asset += assetIn;
        pool.state.interest -= interestDecrease;
        pool.state.cdp -= cdpDecrease;

        emit Sync(maturity, pool.state);
        emit Lend(maturity, msg.sender, bondTo, insuranceTo, assetIn, claimsOut);
    }

    function withdraw(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        Claims memory claimsIn
    ) external override lock returns (Tokens memory tokensOut) {
        require(block.timestamp >= maturity, 'Active');
        require(assetTo != address(0) && collateralTo != address(0), 'Zero');
        require(claimsIn.bond > 0 || claimsIn.insurance > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        tokensOut.asset = WithdrawMath.getAsset(claimsIn.bond, pool.state.reserves.asset, pool.totalClaims.bond);
        tokensOut.collateral = WithdrawMath.getCollateral(
            claimsIn.insurance,
            pool.state.reserves,
            pool.totalClaims
        );

        pool.totalClaims.bond -= claimsIn.bond;
        pool.totalClaims.insurance -= claimsIn.insurance;

        Claims storage sender = pool.claimsOf[msg.sender];

        sender.bond -= claimsIn.bond;
        sender.insurance -= claimsIn.insurance;

        pool.state.reserves.asset -= tokensOut.asset;
        pool.state.reserves.collateral -= tokensOut.collateral;

        reserves.asset -= tokensOut.asset;
        reserves.collateral -= tokensOut.collateral;

        if (tokensOut.asset > 0 && assetTo != address(this)) asset.safeTransfer(assetTo, tokensOut.asset);
        if (tokensOut.collateral > 0 && collateralTo != address(this))
            collateral.safeTransfer(collateralTo, tokensOut.collateral);

        emit Sync(maturity, pool.state);
        emit Withdraw(maturity, msg.sender, assetTo, collateralTo, claimsIn, tokensOut);
    }

    function borrow(
        uint256 maturity,
        address assetTo,
        address debtTo,
        uint128 assetOut,
        uint128 interestIncrease,
        uint128 cdpIncrease
    ) external override lock returns (uint256 id, Debt memory debtOut) {
        require(block.timestamp < maturity, 'Expired');
        require(assetTo != address(0) && debtTo != address(0), 'Zero');
        require(assetOut > 0, 'Invalid');
        require(interestIncrease > 0 || cdpIncrease > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        BorrowMath.check(pool.state, assetOut, interestIncrease, cdpIncrease, fee);

        debtOut.debt = BorrowMath.getDebt(assetOut, interestIncrease, block.timestamp - maturity);
        debtOut.collateral = BorrowMath.getCollateral(pool.state, assetOut, debtOut.debt, cdpIncrease);
        debtOut.startBlock = uint32(block.number);

        uint128 collateralIn = collateral.getCollateralIn(reserves);
        require(collateralIn >= debtOut.collateral, 'Insufficient');

        Debt[] storage debts = pool.debtsOf[debtTo];

        id = debts.length;
        debts.push(debtOut);

        pool.state.reserves.asset -= assetOut;
        pool.state.reserves.collateral += collateralIn;
        pool.state.interest += interestIncrease;
        pool.state.cdp += cdpIncrease;

        reserves.asset -= assetOut;

        if (assetTo != address(this)) asset.safeTransfer(assetTo, assetOut);

        emit Sync(maturity, pool.state);
        emit Borrow(maturity, msg.sender, assetTo, debtTo, assetOut, id, debtOut);
    }

    function pay(
        uint256 maturity,
        address to,
        address owner,
        uint256[] memory ids,
        uint112[] memory assetsPay
    ) external override lock returns (uint128 collateralOut) {
        require(block.timestamp < maturity, 'Expired');
        require(ids.length == assetsPay.length, 'Invalid');
        require(to != address(0), 'Zero');

        Pool storage pool = pools[maturity];

        uint128 assetPay;

        Debt[] storage debts = pool.debtsOf[owner];
        Debt[] memory debtsIn = new Debt[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            Debt storage debt = debts[i];
            require(debt.startBlock != block.number, 'Invalid');

            Debt memory debtIn;
            debtIn.debt = Math.min(debt.debt, assetsPay[i]);

            if (owner == msg.sender) {
                uint112 collateralUnlock = PayMath.getCollateral(debtIn.debt, debt.collateral, debt.debt);
                debt.collateral -= collateralUnlock;
                debtIn.collateral = collateralUnlock;
                collateralOut += collateralUnlock;
            }

            debtIn.startBlock = debt.startBlock;

            assetPay += debtIn.debt;
            debt.debt -= debtIn.debt;

            debtsIn[i] = debtIn;
        }

        uint128 assetIn = asset.getAssetIn(reserves);
        require(assetIn >= assetPay, 'Invalid');

        pool.state.reserves.asset += assetIn;
        pool.state.reserves.collateral -= collateralOut;

        reserves.collateral -= collateralOut;

        if (collateralOut > 0 && to != address(this)) collateral.safeTransfer(to, collateralOut);

        emit Sync(maturity, pool.state);
        emit Pay(maturity, msg.sender, to, owner, assetIn, collateralOut, ids, debtsIn);
    }

    function skim(address assetTo, address collateralTo) external override lock returns (Tokens memory tokensOut) {
        IERC20 _asset = asset;
        IERC20 _collateral = collateral;

        tokensOut.asset = _asset.balanceOf(address(this)).subOrZero(reserves.asset).toUint128();
        tokensOut.collateral = _collateral.balanceOf(address(this)).subOrZero(reserves.collateral).toUint128();

        if (tokensOut.asset > 0) _asset.safeTransfer(assetTo, tokensOut.asset);
        if (tokensOut.collateral > 0) _collateral.safeTransfer(collateralTo, tokensOut.collateral);

        emit Skim(msg.sender, assetTo, collateralTo, tokensOut);
    }

    function totalReserves() external view override returns (Tokens memory) {
        return reserves;
    }

    function state(uint256 maturity) external view override returns (State memory) {
        return pools[maturity].state;
    }

    function totalLiquidity(uint256 maturity) external view override returns (uint256) {
        return pools[maturity].totalLiquidity;
    }

    function liquidityOf(uint256 maturity, address owner) external view override returns (uint256) {
        return pools[maturity].liquidityOf[owner];
    }

    function totalClaims(uint256 maturity) external view override returns (Claims memory) {
        return pools[maturity].totalClaims;
    }

    function claimsOf(uint256 maturity, address owner) external view override returns (Claims memory) {
        return pools[maturity].claimsOf[owner];
    }

    function debtsOf(uint256 maturity, address owner) external view override returns (Debt[] memory) {
        return pools[maturity].debtsOf[owner];
    }
}
