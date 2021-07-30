// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from './interfaces/IPair.sol';
import {IFactory} from './interfaces/IFactory.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {Math} from './libraries/Math.sol';
import {ConstantProduct} from './libraries/ConstantProduct.sol';
import {LendMath} from './libraries/LendMath.sol';
import {BorrowMath} from './libraries/BorrowMath.sol';
import {WithdrawMath} from './libraries/WithdrawMath.sol';
import {SafeCast} from './libraries/SafeCast.sol';
import {SafeTransfer} from './libraries/SafeTransfer.sol';

contract Pair is IPair {
    using Math for uint256;
    using SafeCast for uint256;
    using SafeTransfer for IERC20;

    IFactory public immutable factory;
    IERC20 public immutable asset;
    IERC20 public immutable collateral;
    uint16 public immutable fee;
    uint16 public immutable protocolFee;

    Tokens public totalReserves;
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

    function mint(uint256 maturity) external lock {
        require(block.timestamp < maturity, 'Expired');

        Pool storage pool = pools[maturity];
    }

    function lend(
        uint256 maturity,
        address to,
        uint128 interestDecrease,
        uint128 cdpDecrease
    ) external lock returns (Tokens memory amount) {
        require(block.timestamp < maturity, 'Expired');
        require(interestDecrease > 0 || cdpDecrease > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        uint128 assetBalance = asset.balanceOf(address(this)).toUint128();
        uint128 assetIn = assetBalance - totalReserves.asset;
        require(assetIn > 0, 'Invalid');

        Parameter memory parameter = LendMath.getParameter(pool.parameter, assetIn, interestDecrease, cdpDecrease);

        ConstantProduct.check(parameter, pool.parameter);
        LendMath.checkInterest(assetIn, interestDecrease, parameter.reserves.asset, pool.parameter.interest);

        amount.asset = LendMath.getBond(assetIn, interestDecrease, block.timestamp - maturity);
        amount.collateral = LendMath.getInsurance(
            amount.asset,
            cdpDecrease,
            parameter.reserves.asset,
            pool.parameter.cdp
        );

        pool.bond.supplies.asset += amount.asset;
        pool.bond.supplies.collateral += amount.collateral;

        Tokens storage receiver = pool.bond.balances[to];

        receiver.asset += amount.asset;
        receiver.collateral += amount.collateral;

        totalReserves.asset = assetBalance;

        pool.parameter = parameter;

        emit Sync(maturity, parameter);
        emit Lend(maturity, msg.sender, to, assetIn, amount);
    }

    function borrow(
        uint256 maturity,
        address to,
        uint128 assetOut,
        uint128 interestIncrease,
        uint128 cdpIncrease
    ) external lock returns (uint256 id, Tokens memory amount) {
        require(block.timestamp < maturity, 'Expired');
        require(assetOut > 0, 'Invalid');
        require(interestIncrease > 0 || cdpIncrease > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        uint128 collateralBalance = collateral.balanceOf(address(this)).toUint128();
        uint128 collateralIn = collateralBalance - totalReserves.collateral;

        Parameter memory parameter = BorrowMath.getParameter(
            pool.parameter,
            assetOut,
            collateralIn,
            interestIncrease,
            cdpIncrease
        );

        ConstantProduct.check(parameter, pool.parameter);
        BorrowMath.checkInterest(assetOut, interestIncrease, parameter.reserves.asset, pool.parameter.interest);

        amount.asset = BorrowMath.getDebt(assetOut, interestIncrease, block.timestamp - maturity);
        amount.collateral = BorrowMath.getCollateral(
            amount.asset,
            cdpIncrease,
            parameter.reserves.asset,
            pool.parameter.cdp
        );

        require(collateralIn >= amount.collateral, 'Insufficient');

        Tokens[] storage balances = pool.debt.balances[to];

        id = balances.length;
        balances.push(amount);

        totalReserves.asset -= assetOut;
        totalReserves.collateral = collateralBalance;

        pool.parameter = parameter;

        emit Sync(maturity, parameter);
        emit Borrow(maturity, msg.sender, to, assetOut, id, amount);
    }

    function withdraw(
        uint256 maturity,
        address to,
        Tokens memory tokensIn
    ) external lock returns (Tokens memory amount) {
        require(block.timestamp >= maturity, 'Active');
        require(tokensIn.asset > 0 || tokensIn.collateral > 0, 'Invalid');
        require(to != address(this), 'Invalid');

        Pool storage pool = pools[maturity];

        amount.asset = WithdrawMath.getAsset(tokensIn.asset, pool.parameter.reserves.asset, pool.bond.supplies.asset);
        amount.collateral = WithdrawMath.getCollateral(
            tokensIn.collateral,
            pool.parameter.reserves,
            pool.bond.supplies
        );

        pool.bond.supplies.asset -= tokensIn.asset;
        pool.bond.supplies.collateral -= tokensIn.collateral;

        Tokens storage sender = pool.bond.balances[msg.sender];

        sender.asset -= tokensIn.asset;
        sender.collateral -= tokensIn.collateral;

        pool.parameter.reserves.asset -= amount.asset;
        pool.parameter.reserves.collateral -= amount.collateral;

        totalReserves.asset -= amount.asset;
        totalReserves.collateral -= amount.collateral;

        if (amount.asset > 0) asset.safeTransfer(to, amount.asset);
        if (amount.collateral > 0) collateral.safeTransfer(to, amount.collateral);

        emit Sync(maturity, pool.parameter);
        emit Withdraw(maturity, msg.sender, to, tokensIn, amount);
    }

    function pay(
        uint256 maturity,
        address owner,
        uint256[] memory ids
    ) external lock {
        require(block.timestamp < maturity, 'Expired');

        Pool storage pool = pools[maturity];

        uint128 assetBalance = asset.balanceOf(address(this)).toUint128();
        uint128 assetIn = assetBalance - totalReserves.asset;
        require(assetIn > 0, 'Invalid');

        Tokens[] storage balances = pool.debt.balances[owner];

        pool.parameter.reserves.asset += assetIn;

        totalReserves.asset = assetBalance;

        for (uint256 i = 0; i < ids.length; i++) {
            Tokens storage balance = balances[i];
            assetIn -= balance.asset;
            balance.asset = 0;
        }

        emit Sync(maturity, pool.parameter);
        emit Pay(maturity, msg.sender, owner, assetIn, ids);
    }

    function unlock(
        uint256 maturity,
        address to,
        uint256[] memory ids
    ) external lock returns (uint128 amount) {
        Pool storage pool = pools[maturity];

        Tokens[] storage balances = pool.debt.balances[msg.sender];

        for (uint256 i = 0; i < ids.length; i++) {
            Tokens storage balance = balances[i];
            require(balance.asset == 0, 'Invalid');
            amount += balance.collateral;
            balance.collateral = 0;
        }

        pool.parameter.reserves.collateral -= amount;

        totalReserves.collateral -= amount;

        collateral.safeTransfer(to, amount);

        emit Sync(maturity, pool.parameter);
        emit Unlock(maturity, msg.sender, to, ids, amount);
    }

    function skim(address to) external lock returns (Tokens memory amount) {
        IERC20 _asset = asset;
        IERC20 _collateral = collateral;

        amount.asset = _asset.balanceOf(address(this)).subOrZero(totalReserves.asset).toUint128();
        amount.collateral = _collateral.balanceOf(address(this)).subOrZero(totalReserves.collateral).toUint128();

        if (amount.asset > 0) _asset.safeTransfer(to, amount.asset);
        if (amount.collateral > 0) _collateral.safeTransfer(to, amount.collateral);
    }
}
