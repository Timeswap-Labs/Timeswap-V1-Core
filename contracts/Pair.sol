// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from './interfaces/IPair.sol';
import {IFactory} from './interfaces/IFactory.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {MintMath} from './libraries/MintMath.sol';
import {BurnMath} from './libraries/BurnMath.sol';
import {LendMath} from './libraries/LendMath.sol';
import {WithdrawMath} from './libraries/WithdrawMath.sol';
import {BorrowMath} from './libraries/BorrowMath.sol';
import {PayMath} from './libraries/PayMath.sol';
import {SafeTransfer} from './libraries/SafeTransfer.sol';
import {Reserve} from './libraries/Reserve.sol';
import {BlockNumber} from './libraries/BlockNumber.sol';

/// @title Timeswap Pair
/// @author Timeswap Labs
/// @notice It is recommnded to use Timeswap Convenience to interact with this contract.
/// @notice All error messages are abbreviated and can be found in the documentation.
contract Pair is IPair {
    using SafeTransfer for IERC20;
    using Reserve for IERC20;

    /* ===== MODEL ===== */

    /// @dev The address of the factory contract that deployed this contract.
    IFactory public immutable override factory;
    /// @dev The address of the ERC20 being lent and borrowed.
    IERC20 public immutable override asset;
    /// @dev The address of the ERC20 as collateral.
    IERC20 public immutable override collateral;
    //// @dev The fee earned by liquidity providers. Follows UQ0.16 format.
    uint16 public immutable override fee;
    /// @dev The protocol fee per second earned by the owner. Follows UQ0.40 format.
    uint16 public immutable override protocolFee;

    /// @dev Stores the asset and collateral reserves of the Pair contract.
    Tokens private reserves;
    /// @dev Stores the individual states of each Pool.
    mapping(uint256 => Pool) private pools;

    /// @dev Stores the access state for reentramcy guard.
    uint256 private reentrancyLocked;

    /* ===== VIEW =====*/

    /// @dev Returns the asset and collateral reserves of the Pair contract.
    /// @return The total asset and collateral reserves.
    function totalReserves() external view override returns (Tokens memory) {
        return reserves;
    }

    /// @dev Returns the Constant Product state of a Pool.
    /// @dev The Y state follows the UQ96.32 format.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @return The W, X, Y, and Z state which calculates the price.
    function state(uint256 maturity) external view override returns (State memory) {
        return pools[maturity].state;
    }

    /// @dev Returns the asset ERC20 and collateral ERC20 locked in a Pool.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @return The asset ERC20 and collateral ERC20 locked.
    function lock(uint256 maturity) external view override returns (Tokens memory) {
        return pools[maturity].lock;
    }

    /// @dev Returns the total liquidity supply of a Pool.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @return The total liquidity supply.
    function totalLiquidity(uint256 maturity) external view override returns (uint256) {
        return pools[maturity].totalLiquidity;
    }

    /// @dev Returns the liquidity balance of a user in a Pool.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @param owner The address of the user.
    /// @return The liquidity balance.
    function liquidityOf(uint256 maturity, address owner) external view override returns (uint256) {
        return pools[maturity].liquidities[owner];
    }

    /// @dev Returns the total claims of a Pool.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @return The total claims.
    function totalClaims(uint256 maturity) external view override returns (Claims memory) {
        return pools[maturity].totalClaims;
    }

    /// @dev Returms the claims of a user in a Pool.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @param owner The address of the user.
    /// @return The claims balance.
    function claimsOf(uint256 maturity, address owner) external view override returns (Claims memory) {
        return pools[maturity].claims[owner];
    }

    /// @dev Returns the collateralized debts of a user in a Pool.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @param owner The address of the user.
    /// @return The collateralized debts balance listed in an array.
    function duesOf(uint256 maturity, address owner) external view override returns (Due[] memory) {
        return pools[maturity].dues[owner];
    }

    /* ===== INIT ===== */

    /// @dev Initializes the Pair contract.
    /// @dev Called by the Timeswap factory contract.
    /// @param _asset The address of the ERC20 being lent and borrowed.
    /// @param _collateral The address of the ERC20 as the collateral.
    /// @param _fee The chosen fee rate.
    /// @param _protocolFee The chosen protocol fee rate.
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

    /* ===== MODIFIER ===== */

    /// @dev The modifier for reentrancy guard.
    modifier reentrancyLock() {
        require(reentrancyLocked == 0, 'Reentrancy');
        reentrancyLocked = 1;
        _;
        reentrancyLocked = 0;
    }

    /* ===== UPDATE ===== */

    /// @dev Add liquidity into a Pool by a liquidity provider.
    /// @dev Liquidity providers can be thought as making both lending and borrowing positions.
    /// @dev Must atomically increase the asset ERC20 balance of the Pair contract, before calling.
    /// @dev Must atomically increase the collateral ERC20 balance of the Pair contract, before calling.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @param liquidityTo The address of the receiver of liquidity balance.
    /// @param dueTo The addres of the receiver of collateralized debt balance.
    /// @param interestIncrease The increase in the Y state.
    /// @param cdpIncrease The increase in the Z state.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by debtTo.
    /// @return dueOut The collateralized debt received by debtTo.
    function mint(
        uint256 maturity,
        address liquidityTo,
        address dueTo,
        uint112 interestIncrease,
        uint112 cdpIncrease
    )
        external
        override
        reentrancyLock
        returns (
            uint256 liquidityOut,
            uint256 id,
            Due memory dueOut
        )
    {
        require(block.timestamp < maturity, 'Expired');
        require(liquidityTo != address(0) && dueTo != address(0), 'Zero');
        require(interestIncrease > 0 && cdpIncrease > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        uint128 assetIn = asset.getAssetIn(reserves);
        require(assetIn > 0, 'Invalid');

        if (pool.totalLiquidity == 0) {
            uint256 liquidityTotal = MintMath.getLiquidityTotal(assetIn);
            liquidityOut = MintMath.getLiquidity(maturity, liquidityTotal, protocolFee);

            pool.totalLiquidity += liquidityTotal;
            pool.liquidities[factory.owner()] += liquidityTotal - liquidityOut;
        } else {
            uint256 liquidityTotal = MintMath.getLiquidityTotal(
                pool.state,
                assetIn,
                interestIncrease,
                cdpIncrease,
                pool.totalLiquidity
            );
            liquidityOut = MintMath.getLiquidity(maturity, liquidityTotal, protocolFee);

            pool.totalLiquidity += liquidityTotal;
            pool.liquidities[factory.owner()] += liquidityTotal - liquidityOut;
        }
        require(liquidityOut > 0, 'Invalid');
        pool.liquidities[liquidityTo] += liquidityOut;

        dueOut.debt = MintMath.getDebt(maturity, assetIn, interestIncrease);
        dueOut.collateral = MintMath.getCollateral(maturity, assetIn, interestIncrease, cdpIncrease);
        dueOut.startBlock = BlockNumber.get();

        uint112 collateralIn = collateral.getCollateralIn(reserves);
        require(collateralIn >= dueOut.collateral, 'Insufficient');
        dueOut.collateral = collateralIn;

        Due[] storage dues = pool.dues[dueTo];

        id = dues.length;
        dues.push(dueOut);

        pool.state.asset += assetIn;
        pool.state.interest += interestIncrease;
        pool.state.cdp += cdpIncrease;
        pool.lock.collateral += collateralIn;

        emit Sync(maturity, pool.state);
        emit Mint(maturity, msg.sender, liquidityTo, dueTo, assetIn, liquidityOut, id, dueOut);
    }

    /// @dev Remove liquidity from a Pool by a liquidity provider.
    /// @dev Can only be called after the maturity of the Pool.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @param assetTo The address of the receiver of asset ERC20.
    /// @param collateralTo The addres of the receiver of collateral ERC20.
    /// @param liquidityIn The amount of liquidity balance burnt by the msg.sender.
    /// @return tokensOut The amount of asset ERC20 and collateral ERC20 received.
    function burn(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        uint256 liquidityIn
    ) external override reentrancyLock returns (Tokens memory tokensOut) {
        require(block.timestamp >= maturity, 'Active');
        require(assetTo != address(0) && collateralTo != address(0), 'Zero');
        require(liquidityIn > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        uint256 total = pool.totalLiquidity;

        tokensOut.asset = BurnMath.getAsset(liquidityIn, pool.state.asset, pool.lock.asset, pool.totalClaims.bond, total);
        tokensOut.collateral = BurnMath.getCollateral(liquidityIn, pool.state.asset, pool.lock, pool.totalClaims, total);

        pool.totalLiquidity -= liquidityIn;

        pool.liquidities[msg.sender] -= liquidityIn;

        if (pool.lock.asset >= tokensOut.asset) {
            pool.lock.asset -= tokensOut.asset;
        } else if (pool.lock.asset == 0) {
            pool.state.asset -= tokensOut.asset;
        } else {
            pool.state.asset -= tokensOut.asset - pool.lock.asset;
            pool.lock.asset = 0;
        }
        pool.lock.collateral -= tokensOut.collateral;

        reserves.asset -= tokensOut.asset;
        reserves.collateral -= tokensOut.collateral;

        if (tokensOut.asset > 0 && assetTo != address(this)) asset.safeTransfer(assetTo, tokensOut.asset);
        if (tokensOut.collateral > 0 && collateralTo != address(this))
            collateral.safeTransfer(collateralTo, tokensOut.collateral);

        emit Burn(maturity, msg.sender, assetTo, collateralTo, liquidityIn, tokensOut);
    }

    /// @dev Lend asset ERC20 into the Pool.
    /// @dev Must atomically increase the asset ERC20 balance of the Pair contract, before calling.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @param bondTo The address of the receiver of bond balance.
    /// @param insuranceTo The addres of the receiver of insurance balance.
    /// @param interestDecrease The decrease in Y state.
    /// @param cdpDecrease The decrease in Z state.
    /// @return claimsOut The amount of bond balance and insurance balance received.
    function lend(
        uint256 maturity,
        address bondTo,
        address insuranceTo,
        uint112 interestDecrease,
        uint112 cdpDecrease
    ) external override reentrancyLock returns (Claims memory claimsOut) {
        require(block.timestamp < maturity, 'Expired');
        require(bondTo != address(0) && insuranceTo != address(0), 'Zero');
        require(interestDecrease > 0 || cdpDecrease > 0, 'Invalid');

        Pool storage pool = pools[maturity];
        require(pool.totalLiquidity > 0, 'Invalid');

        uint128 assetIn = asset.getAssetIn(reserves);
        require(assetIn > 0, 'Invalid');

        LendMath.check(pool.state, assetIn, interestDecrease, cdpDecrease, fee);

        claimsOut.bond = LendMath.getBond(maturity, assetIn, interestDecrease);
        claimsOut.insurance = LendMath.getInsurance(maturity, pool.state, assetIn, cdpDecrease);

        pool.totalClaims.bond += claimsOut.bond;
        pool.totalClaims.insurance += claimsOut.insurance;

        pool.claims[bondTo].bond += claimsOut.bond;
        pool.claims[insuranceTo].insurance += claimsOut.insurance;

        pool.state.asset += assetIn;
        pool.state.interest -= interestDecrease;
        pool.state.cdp -= cdpDecrease;

        emit Sync(maturity, pool.state);
        emit Lend(maturity, msg.sender, bondTo, insuranceTo, assetIn, claimsOut);
    }

    /// @dev Withdraw asset ERC20 and/or collateral ERC20 for lenders.
    /// @dev Can only be called after the maturity of the Pool.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @param assetTo The address of the receiver of asset ERC20.
    /// @param collateralTo The addres of the receiver of collateral ERC20.
    /// @param claimsIn The amount of bond balance and insurance balance burnt by the msg.sender.
    /// @return tokensOut The amount of asset ERC20 and collateral ERC20 received.
    function withdraw(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        Claims memory claimsIn
    ) external override reentrancyLock returns (Tokens memory tokensOut) {
        require(block.timestamp >= maturity, 'Active');
        require(assetTo != address(0) && collateralTo != address(0), 'Zero');
        require(claimsIn.bond > 0 || claimsIn.insurance > 0, 'Invalid');

        Pool storage pool = pools[maturity];

        tokensOut.asset = WithdrawMath.getAsset(claimsIn.bond, pool.state.asset, pool.lock.asset, pool.totalClaims.bond);
        tokensOut.collateral = WithdrawMath.getCollateral(
            claimsIn.insurance,
            pool.state.asset,
            pool.lock,
            pool.totalClaims
        );

        pool.totalClaims.bond -= claimsIn.bond;
        pool.totalClaims.insurance -= claimsIn.insurance;

        Claims storage sender = pool.claims[msg.sender];

        sender.bond -= claimsIn.bond;
        sender.insurance -= claimsIn.insurance;

        if (pool.lock.asset >= tokensOut.asset) { 
            pool.lock.asset -= tokensOut.asset;
        } else if (pool.lock.asset == 0) {
            pool.state.asset -= tokensOut.asset;
        } else {
            pool.state.asset -= tokensOut.asset - pool.lock.asset;
            pool.lock.asset = 0;
        }
        pool.lock.collateral -= tokensOut.collateral;

        reserves.asset -= tokensOut.asset;
        reserves.collateral -= tokensOut.collateral;

        if (tokensOut.asset > 0 && assetTo != address(this)) asset.safeTransfer(assetTo, tokensOut.asset);
        if (tokensOut.collateral > 0 && collateralTo != address(this))
            collateral.safeTransfer(collateralTo, tokensOut.collateral);

        emit Withdraw(maturity, msg.sender, assetTo, collateralTo, claimsIn, tokensOut);
    }

    /// @dev Borrow asset ERC20 from the Pool.
    /// @dev Must atomically increase the collateral ERC20 balance of the Pair contract, before calling.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @param assetTo The address of the receiver of asset ERC20.
    /// @param dueTo The addres of the receiver of collateralized debt.
    /// @param assetOut The amount of asset ERC20 received by assetTo.
    /// @param interestIncrease The increase in Y state.
    /// @param cdpIncrease The increase in Z state.
    /// @return id The array index of the collateralized debt received by debtTo.
    /// @return dueOut The collateralized debt received by debtTo.
    function borrow(
        uint256 maturity,
        address assetTo,
        address dueTo,
        uint128 assetOut,
        uint112 interestIncrease,
        uint112 cdpIncrease
    ) external override reentrancyLock returns (uint256 id, Due memory dueOut) {
        require(block.timestamp < maturity, 'Expired');
        require(assetTo != address(0) && dueTo != address(0), 'Zero');
        require(assetOut > 0, 'Invalid');
        require(interestIncrease > 0 || cdpIncrease > 0, 'Invalid');

        Pool storage pool = pools[maturity];
        require(pool.totalLiquidity > 0, 'Invalid');

        BorrowMath.check(pool.state, assetOut, interestIncrease, cdpIncrease, fee);

        dueOut.debt = BorrowMath.getDebt(maturity, assetOut, interestIncrease);
        dueOut.collateral = BorrowMath.getCollateral(maturity, pool.state, assetOut, cdpIncrease);
        dueOut.startBlock = BlockNumber.get();

        uint112 collateralIn = collateral.getCollateralIn(reserves);
        require(collateralIn >= dueOut.collateral, 'Insufficient');
        dueOut.collateral = collateralIn;

        Due[] storage dues = pool.dues[dueTo];

        id = dues.length;
        dues.push(dueOut);

        pool.state.asset -= assetOut;
        pool.state.interest += interestIncrease;
        pool.state.cdp += cdpIncrease;
        pool.lock.collateral += collateralIn;

        reserves.asset -= assetOut;

        if (assetTo != address(this)) asset.safeTransfer(assetTo, assetOut);

        emit Sync(maturity, pool.state);
        emit Borrow(maturity, msg.sender, assetTo, dueTo, assetOut, id, dueOut);
    }

    /// @dev Pay asset ERC20 into the Pool to repay debt for borrowers.
    /// @dev Must atomically increase the asset ERC20 balance of the Pair contract, before calling.
    /// @param maturity The unix timestamp maturity of the Pool.
    /// @param to The address of the receiver of collateral ERC20.
    /// @param owner The addres of the owner of collateralized debt.
    /// @param ids The array indexes of collateralized debts.
    /// @param debtsIn The amount of asset ERC20 paid per collateralized debts.
    /// @return collateralOut The amount of collateral ERC20 received.
    function pay(
        uint256 maturity,
        address to,
        address owner,
        uint256[] memory ids,
        uint112[] memory debtsIn
    ) external override reentrancyLock returns (uint128 collateralOut) {
        require(block.timestamp < maturity, 'Expired');
        require(ids.length == debtsIn.length, 'Invalid');
        require(to != address(0), 'Zero');

        Pool storage pool = pools[maturity];

        uint128 debtIn;

        Due[] storage dues = pool.dues[owner];
        Due[] memory duesIn = new Due[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            Due storage due = dues[i];
            require(due.startBlock != BlockNumber.get(), 'Invalid');

            Due memory dueIn;
            dueIn.debt = PayMath.getDebt(debtsIn[i], due.debt);

            if (owner == msg.sender) {
                uint112 _collateralOut = PayMath.getCollateral(dueIn.debt, due.collateral, due.debt);
                due.collateral -= _collateralOut;
                dueIn.collateral = _collateralOut;
                collateralOut += _collateralOut;
            }

            dueIn.startBlock = due.startBlock;

            debtIn += dueIn.debt;
            due.debt -= dueIn.debt;

            duesIn[i] = dueIn;
        }

        uint128 assetIn = asset.getAssetIn(reserves);
        require(assetIn >= debtIn, 'Invalid');

        pool.lock.asset += assetIn;
        pool.lock.collateral -= collateralOut;

        reserves.collateral -= collateralOut;

        if (collateralOut > 0 && to != address(this)) collateral.safeTransfer(to, collateralOut);

        emit Pay(maturity, msg.sender, to, owner, assetIn, collateralOut, ids, duesIn);
    }

    /// @dev Withdraw any excess asset ERC20 and collateral ERC20 from the Pair.
    /// @param assetTo The address of the receiver of asset ERC20.
    /// @param collateralTo The addres of the receiver of collateral ERC20.
    /// @return assetOut The amount of asset ERC20 received.
    /// @return collateralOut The amount of collateral ERC20 received.
    function skim(
        address assetTo,
        address collateralTo
    ) external override reentrancyLock returns (uint256 assetOut, uint256 collateralOut) {
        IERC20 _asset = asset;
        IERC20 _collateral = collateral;

        assetOut = _asset.getExcess(reserves.asset);
        collateralOut = _collateral.getExcess(reserves.collateral);

        if (assetOut > 0) _asset.safeTransfer(assetTo, assetOut);
        if (collateralOut > 0) _collateral.safeTransfer(collateralTo, collateralOut);

        emit Skim(msg.sender, assetTo, collateralTo, assetOut, collateralOut);
    }
}
