// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from './interfaces/IPair.sol';
import {IFactory} from './interfaces/IFactory.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {Math} from './libraries/Math.sol';
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

    function mint(
        uint256 maturity,
        address to,
        uint128 interestIncrease,
        uint128 cdpIncrease
    ) external lock {
        require(block.timestamp < maturity, 'Expired');

        Pool storage pool = pools[maturity];

        uint128 assetReserve = asset.balanceOf(address(this)).toUint128();
        uint128 assetIn = assetReserve - totalReserves.asset;
        require(assetIn > 0, 'Invalid');

        uint128 collateralReserve = collateral.balanceOf(address(this)).toUint128();
        uint128 collateralIn = collateralReserve - totalReserves.collateral;
    }

    function lend(
        uint256 maturity,
        address bondTo,
        address insuranceTo,
        uint128 interestDecrease,
        uint128 cdpDecrease
    ) external lock returns (Claims memory claimsOut) {
        require(block.timestamp < maturity, 'Expired');
        require(bondTo != address(0) && insuranceTo != address(0), 'Zero');
        require(interestDecrease > 0 || cdpDecrease > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        uint128 assetReserve = asset.balanceOf(address(this)).toUint128();
        uint128 assetIn = assetReserve - totalReserves.asset;
        require(assetIn > 0, 'Invalid');

        LendMath.check(pool.parameter, assetIn, interestDecrease, cdpDecrease, fee);

        claimsOut.bond = LendMath.getBond(assetIn, interestDecrease, block.timestamp - maturity);
        claimsOut.insurance = LendMath.getInsurance(pool.parameter, assetIn, claimsOut.bond, cdpDecrease);

        pool.totalClaims.bond += claimsOut.bond;
        pool.totalClaims.insurance += claimsOut.insurance;

        pool.claimsOf[bondTo].bond += claimsOut.bond;
        pool.claimsOf[insuranceTo].insurance += claimsOut.insurance;

        pool.parameter.reserves.asset += assetIn;
        pool.parameter.interest -= interestDecrease;
        pool.parameter.cdp -= cdpDecrease;

        totalReserves.asset = assetReserve;

        emit Sync(maturity, pool.parameter);
        emit Lend(maturity, msg.sender, bondTo, insuranceTo, assetIn, claimsOut);
    }

    function withdraw(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        Claims memory claimsIn
    ) external lock returns (Tokens memory tokensOut) {
        require(block.timestamp >= maturity, 'Active');
        require(assetTo != address(0) && collateralTo != address(0), 'Zero');
        require(claimsIn.bond > 0 || claimsIn.insurance > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        tokensOut.asset = WithdrawMath.getAsset(claimsIn.bond, pool.parameter.reserves.asset, pool.totalClaims.bond);
        tokensOut.collateral = WithdrawMath.getCollateral(
            claimsIn.insurance,
            pool.parameter.reserves,
            pool.totalClaims // fix it
        );

        pool.totalClaims.bond -= claimsIn.bond;
        pool.totalClaims.insurance -= claimsIn.insurance;

        Claims storage sender = pool.claimsOf[msg.sender];

        sender.bond -= claimsIn.bond;
        sender.insurance -= claimsIn.insurance;

        pool.parameter.reserves.asset -= tokensOut.asset;
        pool.parameter.reserves.collateral -= tokensOut.collateral;

        totalReserves.asset -= tokensOut.asset;
        totalReserves.collateral -= tokensOut.collateral;

        if (tokensOut.asset > 0) asset.safeTransfer(assetTo, tokensOut.asset);
        if (tokensOut.collateral > 0) collateral.safeTransfer(collateralTo, tokensOut.collateral);

        emit Sync(maturity, pool.parameter);
        emit Withdraw(maturity, msg.sender, assetTo, collateralTo, claimsIn, tokensOut);
    }

    function borrow(
        uint256 maturity,
        address assetTo,
        address debtTo,
        uint128 assetOut,
        uint128 interestIncrease,
        uint128 cdpIncrease
    ) external lock returns (uint256 id, Debt memory debtOut) {
        require(block.timestamp < maturity, 'Expired');
        require(assetTo != address(0) && debtTo != address(0), 'Zero');
        require(assetOut > 0, 'Invalid');
        require(interestIncrease > 0 || cdpIncrease > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        uint128 collateralReserve = collateral.balanceOf(address(this)).toUint128();
        uint128 collateralIn = collateralReserve - totalReserves.collateral;

        BorrowMath.check(pool.parameter, assetOut, interestIncrease, cdpIncrease, fee);

        debtOut.debt = BorrowMath.getDebt(assetOut, interestIncrease, block.timestamp - maturity);
        debtOut.collateral = BorrowMath.getCollateral(pool.parameter, assetOut, debtOut.debt, cdpIncrease);
        debtOut.startBlock = uint32(block.number);

        require(collateralIn >= debtOut.collateral, 'Insufficient');

        asset.safeTransfer(assetTo, assetOut);

        Debt[] storage debts = pool.debtsOf[debtTo];

        id = debts.length;
        debts.push(debtOut);

        pool.parameter.reserves.asset -= assetOut;
        pool.parameter.reserves.collateral += collateralIn;
        pool.parameter.interest += interestIncrease;
        pool.parameter.cdp += cdpIncrease;

        totalReserves.asset -= assetOut;
        totalReserves.collateral = collateralReserve;

        emit Sync(maturity, pool.parameter);
        emit Borrow(maturity, msg.sender, assetTo, debtTo, assetOut, id, debtOut);
    }

    function pay(
        uint256 maturity,
        address owner,
        uint256[] memory ids
    ) external lock {
        require(block.timestamp < maturity, 'Expired');

        Pool storage pool = pools[maturity];

        uint128 assetReserve = asset.balanceOf(address(this)).toUint128();
        uint128 assetIn = assetReserve - totalReserves.asset;
        require(assetIn > 0, 'Invalid');

        Debt[] storage debts = pool.debtsOf[owner];

        pool.parameter.reserves.asset += assetIn;

        totalReserves.asset = assetReserve;

        for (uint256 i = 0; i < ids.length; i++) {
            Debt storage debt = debts[i];
            assetIn -= debt.debt;
            debt.debt = 0;
        }

        emit Sync(maturity, pool.parameter);
        emit Pay(maturity, msg.sender, owner, assetIn, ids);
    }

    function unlock(
        uint256 maturity,
        address to,
        uint256[] memory ids
    ) external lock returns (uint128 collateralOut) {
        Pool storage pool = pools[maturity];

        Debt[] storage debts = pool.debtsOf[msg.sender];

        for (uint256 i = 0; i < ids.length; i++) {
            Debt storage debt = debts[i];
            require(debt.startBlock != block.number, 'Invalid');
            require(debt.debt == 0, 'Invalid');
            collateralOut += debt.collateral;
            debt.collateral = 0;
        }

        pool.parameter.reserves.collateral -= collateralOut;

        totalReserves.collateral -= collateralOut;

        collateral.safeTransfer(to, collateralOut);

        emit Sync(maturity, pool.parameter);
        emit Unlock(maturity, msg.sender, to, ids, collateralOut);
    }

    function skim(address to) external lock returns (Tokens memory tokensOut) {
        IERC20 _asset = asset;
        IERC20 _collateral = collateral;

        tokensOut.asset = _asset.balanceOf(address(this)).subOrZero(totalReserves.asset).toUint128();
        tokensOut.collateral = _collateral.balanceOf(address(this)).subOrZero(totalReserves.collateral).toUint128();

        if (tokensOut.asset > 0) _asset.safeTransfer(to, tokensOut.asset);
        if (tokensOut.collateral > 0) _collateral.safeTransfer(to, tokensOut.collateral);
    }
}
