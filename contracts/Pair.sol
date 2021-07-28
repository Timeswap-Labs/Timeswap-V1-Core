// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from './interfaces/IPair.sol';
import {IFactory} from './interfaces/IFactory.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {Math} from './libraries/Math.sol';
import {ConstantProduct} from './libraries/ConstantProduct.sol';
import {LendMath} from './libraries/LendMath.sol';
import {WithdrawMath} from './libraries/WithdrawMath.sol';
import {SafeCast} from './libraries/SafeCast.sol';
import {SafeERC20} from './libraries/SafeERC20.sol';

contract Pair is IPair {
    using Math for uint256;
    using SafeCast for uint256;
    using SafeERC20 for IERC20;

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
        IERC20 _assetERC20,
        IERC20 _collateralERC20,
        uint16 _fee,
        uint16 _protocolFee
    ) {
        factory = IFactory(msg.sender);
        asset = _assetERC20;
        collateral = _collateralERC20;
        fee = _fee;
        protocolFee = _protocolFee;
    }

    function _updateParameter(
        uint256 maturity,
        Pool storage pool,
        Parameter memory parameter
    ) private {
        pool.parameter = parameter;

        emit Sync(maturity, parameter);
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

        uint128 assetIn = asset.getTokenIn(totalReserves.asset);
        require(assetIn > 0, 'Invalid');

        Parameter memory parameter = LendMath.getParameter(pool.parameter, assetIn, interestDecrease, cdpDecrease);

        ConstantProduct.check(parameter, pool.parameter);

        amount.asset = LendMath.getBond(assetIn, interestDecrease, block.timestamp - maturity);
        amount.collateral = LendMath.getInsurance(assetIn, cdpDecrease, parameter.reserves.asset, pool.parameter.cdp);

        pool.bond.supplies.asset += amount.asset;
        pool.bond.supplies.collateral += amount.collateral;

        Tokens storage receiver = pool.bond.balances[to];

        receiver.asset += amount.asset;
        receiver.collateral += amount.collateral;

        _updateParameter(maturity, pool, parameter);

        emit Lend(maturity, msg.sender, to, assetIn, amount);
    }

    function withdraw(
        uint256 maturity,
        address to,
        Tokens memory tokensIn
    ) external lock returns (Tokens memory amount) {
        require(block.timestamp < maturity, 'Active');
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

        if (amount.asset > 0) asset.safeTransfer(to, amount.asset);
        if (amount.collateral > 0) collateral.safeTransfer(to, amount.collateral);

        emit Withdraw(maturity, msg.sender, to, tokensIn, amount);
    }
}
