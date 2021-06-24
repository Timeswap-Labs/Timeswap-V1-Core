// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {InterfaceTimeswapPool} from "./interfaces/InterfaceTimeswapPool.sol";
import {InterfaceTimeswapFactory} from "./interfaces/InterfaceTimeswapFactory.sol";
import {InterfaceERC20} from "./interfaces/InterfaceERC20.sol";
import {InterfaceTimeswapERC20} from "./interfaces/InterfaceTimeswapERC20.sol";
import {InterfaceTimeswapERC721} from "./interfaces/InterfaceTimeswapERC721.sol";
import {Math} from "./libraries/Math.sol";
import {String} from "./libraries/String.sol";
import {ConstantProduct} from "./libraries/ConstantProduct.sol";
import {ERC20Permit} from "./ERC20Permit.sol";

/// @title Timeswap Pool
/// @author Ricsson W. Ngo
/// @notice It is recommended to use Timeswap Convenience Contracts to interact with this contract
/// @dev It is necessary to do safety checks when interacting with this contract
/// @dev The pool contract is a liquidity ERC20 token contract
contract TimeswapPool is InterfaceTimeswapPool, ERC20Permit {
    using Math for uint256;
    using String for uint256;
    using Clones for address;

    /* ===== MODEL ===== */

    /// @dev The base precision when dealing with transaction fee and protocol fee
    uint256 private constant BASE = 10000;
    /// @dev The minimum liquidity minted and sent to the zero address for the first mint
    uint256 private constant MINIMUM_LIQUIDITY = 1000;
    /// @dev The number of seconds in a year
    uint256 private constant YEAR = 31556926;

    /// @dev The fee rate for the revenue of liquidity providers
    uint128 public override transactionFee; //immutable
    /// @dev The fee rate for the revenue of feeTo address
    uint128 public override protocolFee; //immutable

    /// @dev The maturity of the pool and all its transactions
    uint256 public override maturity; //immutable

    /// @dev Stores the balance of the contract in the ERC20 being lent and borrowed (asset ERC20)
    /// @dev The X pool or the Principal pool
    uint128 public override assetReserve;
    /// @dev Stores the virtual rate reserves
    uint128 public override rateReserve;
    /// @dev Stores the balance of the contract in the ERC20 used as collateral (collateral ERC20)
    /// @dev The W pool or the Collateral Locked pool
    uint256 public override collateralReserve;

    /// @dev The address of the factory contract that deployed this contract
    InterfaceTimeswapFactory public override factory; //immutable

    /// @dev The address of the ERC20 being lent and borrowed
    InterfaceERC20 public override asset; //immutable
    /// @dev The address of the ERC20 used as collateral
    InterfaceERC20 public override collateral; //immutable

    /// @dev The address of the native bond ERC20 token contract
    /// @dev Get the Y pool or the Collateral Required pool by getting the bond ERC20 balance of the pool contract
    InterfaceTimeswapERC20 public override bond; //immutable
    /// @dev The address of the native insurance ERC20 token contract
    /// @dev Get the V pool by getting the insurance ERC20 balance of the pool contract
    InterfaceTimeswapERC20 public override insurance; //immutable
    /// @dev The address of the native collateralized debt ERC721 token contract
    InterfaceTimeswapERC721 public override collateralizedDebt; //immutable

    /// @dev The name of the native liquidity ERC20 token contract based on ERC20 Metadata standard
    string public constant override name = "Timeswap Liquidity";
    /// @dev The symbol ticker of the native liquidity ERC20 token contract based on ERC20 Metadata standard
    string public override symbol; //immutable
    /// @dev The decimal place precision of the native liquidity ERC20 token contract based on ERC20 Metadata standard
    uint8 public override decimals; //immutable

    /// @dev The function selector of the symbol function on ERC20 Metadata standard
    bytes4 private constant SYMBOL = bytes4(keccak256(bytes("symbol()")));
    /// @dev The function selector of the decimals function on ERC20 Metadata standard
    bytes4 private constant DECIMALS = bytes4(keccak256(bytes("decimals()")));
    /// @dev The function selector of the transfer function on ERC20 standard
    bytes4 private constant TRANSFER = bytes4(keccak256(bytes("transfer(address,uint256)")));

    /// @dev Stores the access state of the contract for reentrancy guard
    bool private locked;

    /// @dev Locks the contract from reentering when calling a function and unlocks at the end of the call
    modifier reentrancyLock() {
        require(!locked, "TimeswapPool :: reentrancyLock : Locked");
        locked = true;
        _;
        locked = false;
    }

    /* ===== INIT ===== */

    /// @dev Initializes the pool contract
    /// @dev Can only be called by the factory contract
    /// @param _asset The address of the ERC20 being lent and borrowed
    /// @param _collateral The address of the ERC20 used as collateral
    /// @param _maturity The maturity time of the pool in unix timestamp
    /// @param _bond The address of the original bond ERC20 token contract where we clone from
    /// @param _insurance The address of the original insurance ERC20 token contract where we clone from
    /// @param _collateralizedDebt The address of the original collateralized debt ERC721 token contract where we clone from
    /// @param _transactionFee The fee for the revenue of liquidity providers
    /// @param _protocolFee The fee for the revenue of feeTo address
    function initialize(
        InterfaceERC20 _asset,
        InterfaceERC20 _collateral,
        uint256 _maturity,
        InterfaceTimeswapERC20 _bond,
        InterfaceTimeswapERC20 _insurance,
        InterfaceTimeswapERC721 _collateralizedDebt,
        uint128 _transactionFee,
        uint128 _protocolFee
    ) external override {
        // Sanity check
        require(
            block.timestamp < _maturity,
            "TimeswapPool :: initialize : Invalid Maturity"
        );
        // Can only be called once
        require(
            factory == InterfaceTimeswapFactory(ZERO),
            "TimeswapPool :: initialize : Forbidden"
        );

        maturity = _maturity;

        factory = InterfaceTimeswapFactory(msg.sender);

        asset = _asset;
        collateral = _collateral;

        // Clone and deploy the three native token contracts
        bond = InterfaceTimeswapERC20(
            address(_bond).cloneDeterministic(keccak256("0"))
        );
        insurance = InterfaceTimeswapERC20(
            address(_insurance).cloneDeterministic(keccak256("0"))
        );
        collateralizedDebt = InterfaceTimeswapERC721(
            address(_collateralizedDebt).cloneDeterministic(keccak256("0"))
        );

        transactionFee = _transactionFee;
        protocolFee = _protocolFee;

        // Safely get the symbol tickers of the pair ERC20 token contracts
        string memory _assetSymbol = _safeSymbol(_asset);
        string memory _collateralSymbol = _safeSymbol(_collateral);
        // The symbol tickers of all native tokens end with this format
        // -{asset symbol}-{collateral symbol}-{maturity time in unix timestamp}
        string memory _symbol = string(
            abi.encodePacked(
                "-",
                _assetSymbol,
                "-",
                _collateralSymbol,
                "-",
                _maturity.toString()
            )
        );
        // Safely get the decimal places of the pair ERC20 token contracts
        uint8 _assetDecimal = _safeDecimals(_asset);
        uint8 _collateralDecimal = _safeDecimals(_collateral);

        // Initializes the three native tokens with the correct decimal places
        bond.initialize(_symbol, _collateralDecimal);
        insurance.initialize(_symbol, _assetDecimal);
        collateralizedDebt.initialize(
            _symbol,
            _collateralDecimal,
            _assetDecimal
        );

        // The symbol ticker of the liquidity ERC20 token contract follows this format
        // LP-{asset symbol}-{collateral symbol}-{maturity time in unix timestamp}
        // Example for pair DAI as the asset and WETH as the collateral at maturity time 1750000000
        // LP-DAI-WETH-1750000000
        // Example for another pair DAI as the asset but the collateral ERC20 has no symbol ticker with the same maturity as above
        // LP-DAI--1750000000
        symbol = string(abi.encodePacked("LP", _symbol));
        // Initialize the liquidity ERC20 contract with the correct decimal places
        decimals = _assetDecimal;

        _setDomainSeparator(name);
    }

    /* ===== HELPER ===== */

    /// @dev Safely gets the symbol ticker of an ERC20 token contract
    /// @dev Returns an empty string if failed at calling the symbol function
    function _safeSymbol(InterfaceERC20 _token)
        private
        returns (string memory _symbol)
    {
        (bool _success, bytes memory _data) = address(_token).call(
            abi.encodeWithSelector(SYMBOL)
        );
        _symbol = _success ? abi.decode(_data, (string)) : "";

        bytes memory _bt = bytes(_symbol);
        if (_bt.length > 5)
            _symbol = string(
                abi.encodePacked(_bt[0], _bt[1], _bt[2], _bt[3], _bt[4], "...")
            );
    }

    /// @dev Safely gets the decimal place of an ERC20 token contract
    /// @dev Returns zero if failed at calling the decimals function
    function _safeDecimals(InterfaceERC20 _token)
        private
        returns (uint8 _decimals)
    {
        (bool _success, bytes memory _data) = address(_token).call(
            abi.encodeWithSelector(DECIMALS)
        );
        _decimals = _success ? abi.decode(_data, (uint8)) : 0;
    }

    /// @dev Safely transfer the tokens of an ERC20 token contract
    /// @dev Will revert if failed at calling the transfer function
    function _safeTransfer(
        InterfaceERC20 _token,
        address _to,
        uint256 _value
    ) private {
        (bool _success, bytes memory _data) = address(_token).call(
            abi.encodeWithSelector(TRANSFER, _to, _value)
        );
        require(
            _success && (_data.length == 0 || abi.decode(_data, (bool))),
            "TimeswapPool :: _safeTransfer : Transfer Failed"
        );
    }

    /// @dev Safely transfer the tokens of an ERC20 token contract and return the new balance of the pool contract
    /// @dev will revert if failed at calling the transfer function
    function _transferAndBalanceOf(
        InterfaceERC20 _token,
        address _to,
        uint256 _tokenOut
    ) private returns (uint256 _tokenBalance) {
        _safeTransfer(_token, _to, _tokenOut);
        _tokenBalance = _token.balanceOf(address(this));
    }

    /// @dev Return the X pool, Y pool, and the Z pool
    /// @dev Only used for the mint function and lend function
    /// @dev The Z pool or Interest Rate pool is the asset ERC20 annual interest rate
    /// @return _assetReserve The X pool or Principal pool
    /// @return _bondReserve The Y pool or Collateral Required pool
    /// @return _rateReserve The Z pool, a virtual pool
    function _viewReserves()
        private
        view
        returns (
            uint256 _assetReserve,
            uint256 _bondReserve,
            uint256 _rateReserve
        )
    {
        _assetReserve = assetReserve;
        _bondReserve = bond.balanceOf(address(this));
        _rateReserve = rateReserve;
    }

    /// @dev Update the assetReserve and collateralReserve with the given balances of the pair ERC20 tokens
    /// @dev The Y pool and V pool is always equal to the bond and insurance balance of the pool contract
    /// @param _assetBalance The new balance to replace the assetReserve or X pool
    /// @param _collateralBalance The new balance to replace the collateralReserve of W pool
    /// @param _rateBalance The new balance to replace the Z pool
    function _updateReserves(
        uint256 _assetBalance,
        uint256 _collateralBalance,
        uint256 _rateBalance
    ) private {
        // Get the bond and insurance balance of the pool contract
        uint256 _bondBalance = bond.balanceOf(address(this));
        uint256 _insuranceBalance = insurance.balanceOf(address(this));

        // The pair ERC20 balance of the pool contract is capped at uint128
        // Can be resolved with the sync function if someone transfer tokens to the pool contract such that the balance is greater than uint128
        require(
            _assetBalance <= MAXIMUM_BALANCE && _rateBalance <= MAXIMUM_BALANCE,
            "TimeswapPool :: _updateReserves : Reserve Overflow"
        );
        assetReserve = uint128(_assetBalance);
        rateReserve = uint128(_rateBalance);
        collateralReserve = _collateralBalance;

        emit Sync(
            _assetBalance,
            _collateralBalance,
            _rateBalance,
            _bondBalance,
            _insuranceBalance
        );
    }

    /* ====== MINT ===== */

    /// @dev Add liquidity into the pool contract by a liquidity provider
    /// @dev Liquidity providers can be seen as making both a lending transaction and borrowing transaction at the same time
    /// @dev Must atomically increase the asset ERC20 balance of the pool contract with a transaction before calling the mint function
    /// @dev Increasing the asset ERC20 balance of the pool contract before calling this function will determine the assetIn parameter
    /// @dev Must atomically increase the collateral ERC20 balance of the pool contract with a transaction before calling the mint function
    /// @dev Increasing the collateral ERC20 balance of the pool contract before calling this function will determine the collateralIn parameter
    /// @param _to The receiver of the mint function
    /// @param _bondIncreaseAndCollateralPaid The increase in the Y pool and the amount of collateral ERC20 to be deposited to the pool contract
    /// @param _insuranceIncreaseAndDebtRequired The increase in the V pool and the amount of debt received
    /// @return _tokenId The id of the newly minted collateralized debt ERC721 token contract
    /// @return _bondReceivedAndCollateralLocked The amount of bond ERC20 received by the receiver and the amount of collateral ERC20 to be locked
    /// @return _insuranceReceivedAndAssetIn The amount of insurance ERC20 received by the receiver and the increase in the X pool
    /// @return _liquidityReceived The amount of liquidity ERC20 received by the receiver
    function mint(
        address _to,
        uint256 _bondIncreaseAndCollateralPaid,
        uint256 _insuranceIncreaseAndDebtRequired
    )
        external
        override
        reentrancyLock()
        returns (
            uint256 _tokenId,
            uint256 _bondReceivedAndCollateralLocked,
            uint256 _insuranceReceivedAndAssetIn,
            uint256 _liquidityReceived
        )
    {
        require(
            block.timestamp < maturity,
            "TimeswapPool :: mint : Pool Matured"
        );
        require(
            _bondIncreaseAndCollateralPaid > 0 &&
                _insuranceIncreaseAndDebtRequired > 0,
            "TimeswapPool :: mint : Insufficient Increase"
        );

        // Get the X pool, Y pool, and Z pool
        (
            uint256 _assetReserve,
            uint256 _bondReserve,
            uint256 _rateReserve
        ) = _viewReserves();

        // Get the difference of the stored X pool and the asset ERC20 balance of the pool contract to get the _insuranceReceivedAndAssetIn
        uint256 _assetBalance = asset.balanceOf(address(this));
        _insuranceReceivedAndAssetIn = _assetBalance.subOrZero(_assetReserve);
        require(
            _insuranceReceivedAndAssetIn > 0,
            "TimeswapPool :: mint : Insufficient Asset Input Amount"
        );

        // Call the function _mintInitialLiquidity for the first mint function, will only be called once
        // Call the function _mintProportionalLiquidity for all subsequent mint functions
        // The invariance is updated within these two functions
        uint256 _rateBalance;
        (_rateBalance, _liquidityReceived) = totalSupply == 0
            ? _mintInitialLiquidity(_to, _insuranceIncreaseAndDebtRequired)
            : _mintProportionalLiquidity(
                _to,
                _insuranceReceivedAndAssetIn,
                _bondIncreaseAndCollateralPaid,
                _insuranceIncreaseAndDebtRequired,
                _assetReserve,
                _bondReserve,
                _rateReserve
            );

        // Mint and increase the bond balance and insurance balance of the pool contract
        bond.mint(address(this), _bondIncreaseAndCollateralPaid);
        insurance.mint(address(this), _insuranceIncreaseAndDebtRequired);

        // Get the difference of the stored W pool and the collateral ERC20 balance of the pool contract to get the collateralIn
        // Check that there is enough collateralIn for both collateral deposited and collateral locked
        // Must precalculate the collateralIn with a convenience contract to avoid unecessary loss of collateral ERC20
        _bondReceivedAndCollateralLocked = (_bondIncreaseAndCollateralPaid *
            _insuranceIncreaseAndDebtRequired)
        .divUp(_insuranceReceivedAndAssetIn);
        uint256 _collateralBalance = collateral.balanceOf(address(this));
        require(
            _collateralBalance.subOrZero(collateralReserve) >=
                _bondIncreaseAndCollateralPaid +
                    _bondReceivedAndCollateralLocked,
            "Timeswap :: _mintInitial : Insufficient Collateral Input Amount"
        );

        // Mint and increase the bond balance and insurance balance of the receiver
        bond.mint(_to, _bondReceivedAndCollateralLocked);
        insurance.mint(_to, _insuranceReceivedAndAssetIn);

        // Mint a collateralized debt token for the receiver
        collateralizedDebt.mint(
            _to,
            _bondReceivedAndCollateralLocked,
            _insuranceIncreaseAndDebtRequired
        );
        _tokenId = collateralizedDebt.totalSupply();

        // Update all the pool
        _updateReserves(_assetBalance, _collateralBalance, _rateBalance);

        emit Mint(
            msg.sender,
            _to,
            _tokenId,
            _bondIncreaseAndCollateralPaid,
            _insuranceIncreaseAndDebtRequired,
            _bondReceivedAndCollateralLocked,
            _insuranceReceivedAndAssetIn,
            _liquidityReceived
        );
    }

    /// @dev Mint the initial liquidity for the first mint function
    /// @dev Initial supply of liquidity ERC20 is equal to the initial insurance ERC20 minted to the pool contract
    function _mintInitialLiquidity(
        address _to,
        uint256 _insuranceIncreaseAndDebtRequired
    ) private returns (uint256 _rateBalance, uint256 _liquidityReceived) {
        require(
            _insuranceIncreaseAndDebtRequired > MINIMUM_LIQUIDITY,
            "Timeswap :: _mintInitialLiquidity : Must Mint more Liquidity"
        );

        uint256 _protocolFeeBase = protocolFee + BASE; // gas saving

        // Adjust liquidity received with protocol fee and base precision
        _liquidityReceived =
            ((_insuranceIncreaseAndDebtRequired - MINIMUM_LIQUIDITY) * BASE) /
            _protocolFeeBase;

        // Burn MINIMUM_LIQUIDITY amount of liquidity ERC20 to avoid DOS attack to other liquidity providers
        // Enforce protocol fee minted to the feeTo address
        _mint(ZERO, MINIMUM_LIQUIDITY); // burn minimum liquidity
        _mint(_to, _liquidityReceived);
        _mint(
            factory.feeTo(),
            _insuranceIncreaseAndDebtRequired -
                _liquidityReceived -
                MINIMUM_LIQUIDITY
        );

        // The initial Z pool is calculated from the initial insurance ERC20 minted divided by duration from now to the maturity of the pool
        // The initial Z pool is adjusted with YEAR so that it becomes the annual interest rate
        _rateBalance =
            (_insuranceIncreaseAndDebtRequired * YEAR) /
            (maturity - block.timestamp);
    }

    /// @dev Mint more liquidity for all the subsequent mint functions
    /// @dev The increase of liquidity ERC20 must be at least proportional to the proportional increase of X pool, Y pool, Z pool, and V pool
    function _mintProportionalLiquidity(
        address _to,
        uint256 _insuranceReceivedAndAssetIn,
        uint256 _bondIncreaseAndCollateralPaid,
        uint256 _insuranceIncreaseAndDebtRequired,
        uint256 _assetReserve,
        uint256 _bondReserve,
        uint256 _rateReserve
    ) private returns (uint256 _rateBalance, uint256 _liquidityReceived) {
        uint256 _protocolFeeBase = protocolFee + BASE; // gas saving

        uint256 _totalSupply = totalSupply; // gas saving

        // Compare the proportional increase of X pool, Y pool, and V pool
        // The total increase of the liquidity ERC20 must be less than or equal to all the proportional increase of the pools
        // Must precalculate the inputs with a convenience contract to make the proportion close and minimize cost
        uint256 _liquidityReceivedAdjusted = Math.min(
            (_insuranceReceivedAndAssetIn * _totalSupply) / _assetReserve,
            (_bondIncreaseAndCollateralPaid * _totalSupply) / _bondReserve,
            (_insuranceIncreaseAndDebtRequired * _totalSupply) /
                insurance.balanceOf(address(this))
        );

        // Adjust liquidity received with protocol fee and base precision
        _liquidityReceived =
            (_liquidityReceivedAdjusted * BASE) /
            _protocolFeeBase;

        // Enforce the protocol fee minted to the feeTo address
        _mint(_to, _liquidityReceived);
        _mint(factory.feeTo(), _liquidityReceivedAdjusted - _liquidityReceived);

        // The increase in the Z pool must also be proportional to the proportional increase of the pools
        _rateBalance =
            _rateReserve +
            (_liquidityReceivedAdjusted * _rateReserve).divUp(_totalSupply);
    }

    /* ===== BURN ===== */

    /// @dev Withdraw liquidity from the pool contract by a liquidity provider
    /// @dev Must atomically increase the liquidity ERC20 balance of the pool contract with a transaction before calling the burn function
    /// @dev Increasing the liquidity ERC20 balance of the pool contract before calling this function will determine the liquidityIn parameter
    /// @dev Optionally atomically increase the collateral ERC20 balance of the pool contract with a transaction before calling the burn function
    /// @dev Increasing the collateral ERC20 balance of the pool contract before calling this function will determine the collateralIn parameter
    /// @dev Liquidity providers receive asset ERC20 from the pool contract if there is collateralIn before the maturity of the pool
    /// @dev Do not increase the collateral ERC20 balances of the pool contract if the pool is already matured, as no asset ERC20 can be borrowed
    /// @param _to The receiver of the burn function
    /// @return _tokenId The id of the newly minted collateralized debt ERC721 token contract
    /// @return _collateralLocked The amount of collateral ERC20 to be locked
    /// @return _debtRequiredAndAssetReceived The amount of debt received by the receiver and the asset ERC20 received by the receiver
    /// @return _bondReceived The amount of bond ERC20 received by the receiver
    /// @return _insuranceReceived The amount of insurance ERC20 received by the receiver
    function burn(address _to)
        external
        override
        reentrancyLock()
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequiredAndAssetReceived,
            uint256 _bondReceived,
            uint256 _insuranceReceived
        )
    {
        uint256 _totalSupply = totalSupply; // gas saving

        // Get liquidity ERC20 balance of the pool contract to get the _liquidityIn
        uint256 _liquidityIn = balanceOf[address(this)];
        require(
            _liquidityIn > 0,
            "Timeswap :: burn : Insufficient Liquidity Input Amount"
        );

        // Get the X pool, Y pool, and Z pool
        (
            uint256 _assetReserve,
            uint256 _bondReserve,
            uint256 _rateReserve
        ) = _viewReserves();

        // Get the proportional withdraw of the Y pool and V pool to the receiver
        _bondReceived = (_liquidityIn * _bondReserve) / _totalSupply;
        _insuranceReceived =
            (_liquidityIn * insurance.balanceOf(address(this))) /
            _totalSupply;

        // Safely transfer the bond ERC20 and insurance ERC20 to the receiver
        _safeTransfer(bond, _to, _bondReceived);
        _safeTransfer(insurance, _to, _insuranceReceived);

        // Call the _burnBeforeMaturity for all burn functions before maturity of the pool
        // When burn function is called before the maturity of the pool, receiver can borrow asset ERC20 based on how much collateral ERC20 is locked
        // The invariance and the pools are updated within this function
        // When burn function is called after the maturity of the pool, there is no need to update invariance and the pools
        // When burn function is called after the maturity of the pool, _tokenId, _collateralLocked, and _debtRequiredAndAssetReceived are all zero
        if (block.timestamp < maturity)
            (
                _tokenId,
                _collateralLocked,
                _debtRequiredAndAssetReceived
            ) = _burnBeforeMaturity(
                _to,
                _liquidityIn,
                _totalSupply,
                _bondReceived,
                _assetReserve,
                _rateReserve
            );

        // Burn all the liquidity ERC20 in the pool contract
        _burn(address(this), _liquidityIn);

        emit Burn(
            msg.sender,
            _to,
            _tokenId,
            _liquidityIn,
            _collateralLocked,
            _debtRequiredAndAssetReceived,
            _bondReceived,
            _insuranceReceived
        );
    }

    /// @dev Borrow proportional asset ERC20 based on collateralLocked
    /// @dev Update the invariance and the pools
    /// @dev Only called when the burn function is called before maturity of the pool
    function _burnBeforeMaturity(
        address _to,
        uint256 _liquidityIn,
        uint256 _totalSupply,
        uint256 _bondReceived,
        uint256 _assetReserve,
        uint256 _rateReserve
    )
        private
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequiredAndAssetReceived
        )
    {
        // Get the maximum amount of asset ERC20 possible to be borrowed based on the proportional decrease of the pools
        uint256 _assetMax = (_liquidityIn * _assetReserve) / _totalSupply;

        // Get the difference of the stored W pool and the collateral ERC20 balance of the pool contract to get the collateralLocked
        // The maximum necessary collateralLocked is the proportional decrease of the Y pool
        // Must precalculate the collateralLocked with a convenience contract to avoid unecessary loss of collateral ERC20
        uint256 _collateralBalance = collateral.balanceOf(address(this));
        _collateralLocked = _collateralBalance.subOrZero(collateralReserve);
        _collateralLocked = _collateralLocked >= _bondReceived
            ? _bondReceived
            : _collateralLocked;

        // Get the debt received and the asset received based on the amount of collateral locked
        _debtRequiredAndAssetReceived =
            (_assetMax * _collateralLocked) /
            _bondReceived;

        // Mint collateralized debt ERC721 when there is collateral locked and debt received
        if (_debtRequiredAndAssetReceived > 0) {
            collateralizedDebt.mint(
                _to,
                _collateralLocked,
                _debtRequiredAndAssetReceived
            );
            _tokenId = collateralizedDebt.totalSupply();
        }

        // Transfer the asset ERC20 to the receiver
        uint256 _assetBalance = _transferAndBalanceOf(
            asset,
            _to,
            _debtRequiredAndAssetReceived
        );

        // The decrease in the Z pool must also be proportional to the proportional decrease of the pools
        uint256 _rateBalance = _rateReserve -
            ((_liquidityIn * _rateReserve) / _totalSupply);

        // Update all the pools
        _updateReserves(_assetBalance, _collateralBalance, _rateBalance);
    }

    /* ===== LEND ===== */

    /// @dev Lend asset ERC20 to the pool contract to receive bond ERC20 and insurance ERC20 by the lender
    /// @dev Must atomically increase the asset ERC20 balance of the pool contract with a transaction before calling the lend function
    /// @dev Increasing the asset ERC20 balance of the pool contract before calling this function will determine the assetIn parameter
    /// @param _to The receiver of the lend function
    /// @param _bondDecrease The decrease in the Y pool
    /// @param _rateDecrease The decrease in the Z pool
    /// @return _bondReceived The amount of bond ERC20 received by the receiver
    /// @return _insuranceReceived The amount of insurance ERC20 received by the receiver
    function lend(
        address _to,
        uint256 _bondDecrease,
        uint256 _rateDecrease
    )
        external
        override
        reentrancyLock()
        returns (uint256 _bondReceived, uint256 _insuranceReceived)
    {
        require(
            block.timestamp < maturity,
            "TimeswapPool :: lend : Pool Matured"
        );
        require(
            _bondDecrease > 0 || _rateDecrease > 0,
            "TimeswapPool :: lend : Insufficient Decrease"
        );
        require(
            totalSupply > 0,
            "TimeswapPool :: lend : Total supply must not be Zero"
        );

        // Get the X pool, Y pool, and Z pool
        (
            uint256 _assetReserve,
            uint256 _bondReserve,
            uint256 _rateReserve
        ) = _viewReserves();

        // Get the difference of the stored X pool and the asset ERC20 balance of the pool contract to get the _assetIn
        // _assetIn is the increase in the X pool
        uint256 _assetBalance = asset.balanceOf(address(this));
        uint256 _assetIn = _assetBalance.subOrZero(_assetReserve);
        require(
            _assetIn > 0,
            "TimeswapPool :: lend : Insufficient Asset Input Amount"
        );

        // Check that the constant product formula is followed
        _checkInvarianceForLend(
            _assetBalance,
            _assetReserve,
            _bondReserve,
            _rateReserve,
            _bondDecrease,
            _rateDecrease
        );

        // Transfer and mint bond ERC20 and insurance ERC20 to the receiver
        _bondReceived = _bondDecrease > 0
            ? _transferAndMintBondTokens(
                _to,
                _bondDecrease,
                _assetReserve,
                _rateReserve
            )
            : 0;
        _insuranceReceived = _rateDecrease > 0
            ? _transferAndMintInsuranceTokens(
                _to,
                _rateDecrease,
                _assetBalance,
                _rateReserve
            )
            : 0;

        // Update all the pools
        _updateReserves(
            _assetBalance,
            collateral.balanceOf(address(this)),
            _rateReserve - _rateDecrease
        );

        emit Lend(
            msg.sender,
            _to,
            _assetIn,
            _bondReceived,
            _insuranceReceived
        );
    }

    /// @dev Check the constant product formula is followed for a lending transaction
    function _checkInvarianceForLend(
        uint256 _assetBalance,
        uint256 _assetReserve,
        uint256 _bondReserve,
        uint256 _rateReserve,
        uint256 _bondDecrease,
        uint256 _rateDecrease
    ) private view {
        uint256 _transactionFeeBase = BASE + transactionFee; // gas saving

        // Adjust the bond and rate decrease to enforce the transaction fee to the liquidity provider
        uint256 _bondBalanceAdjusted = _tokenDecreaseAdjust(
            _bondDecrease,
            _bondReserve,
            _transactionFeeBase
        );
        uint256 _rateBalanceAdjusted = _tokenDecreaseAdjust(
            _rateDecrease,
            _rateReserve,
            _transactionFeeBase
        );

        // Check the constant product formula is followed
        // _bondDecrease and _rateDecrease must be precalculated by a convenience contract
        ConstantProduct.check(
            _assetBalance,
            _bondBalanceAdjusted * _rateBalanceAdjusted,
            _assetReserve,
            _bondReserve * _rateReserve
        );
    }

    /// @dev Adjust the bond and rate decrease for the lending transaction
    /// @dev returns value adjusted with base precision
    function _tokenDecreaseAdjust(
        uint256 _tokenDecrease,
        uint256 _tokenReserve,
        uint256 _transactionFeeBase
    ) private pure returns (uint256 _tokenBalanceAdjusted) {
        // Adjust all value with the base precision
        _tokenBalanceAdjusted += _tokenReserve * BASE;
        _tokenBalanceAdjusted -= _tokenDecrease * _transactionFeeBase;
        _tokenBalanceAdjusted /= BASE;
    }

    /// @dev Transfer bond ERC20 from the pool to the receiver
    /// @dev Mint bond ERC20 to the receiver
    function _transferAndMintBondTokens(
        address _to,
        uint256 _bondDecrease,
        uint256 _assetReserve,
        uint256 _rateReserve
    ) private returns (uint256 _bondReceived) {
        InterfaceTimeswapERC20 _bond = bond; // gas saving

        // Get the amount of bond ERC20 minted
        // Always round down in division to minimize the cost to the pool contract
        uint256 _bondMint = (_bondDecrease * _rateReserve) / _assetReserve;
        _bondMint = (_bondMint * (maturity - block.timestamp)) / YEAR;
        _bondReceived = _bondDecrease + _bondMint;

        // Safely transfer and mint bond ERC20 to the receiver
        _safeTransfer(_bond, _to, _bondDecrease);
        if (_bondMint > 0) _bond.mint(_to, _bondMint);
    }

    /// @dev Transfer insurance ERC20 from the pool to the receiver
    /// @dev Mint insurance ERC20 to the receiver
    function _transferAndMintInsuranceTokens(
        address _to,
        uint256 _rateDecrease,
        uint256 _assetBalance,
        uint256 _rateReserve
    ) private returns (uint256 _insuranceReceived) {
        InterfaceTimeswapERC20 _insurance = insurance; // gas saving

        // Get the amount of insurance decrease of the pool from rate decrease multiply by duration from now to the maturity of the pool
        // Get the amount of insurance ERC20 minted
        // Always round down in division to minimize cost to the pool contract
        uint256 _insuranceDecrease = (_rateDecrease *
            (maturity - block.timestamp)) / YEAR;
        uint256 _insuranceMint = (_rateDecrease * _assetBalance) / _rateReserve;
        _insuranceReceived = _insuranceDecrease + _insuranceMint;

        // Safely transfer and mint insurance ERC20 to the receiver
        _safeTransfer(_insurance, _to, _insuranceDecrease);
        if (_insuranceMint > 0) _insurance.mint(_to, _insuranceMint);
    }

    /* ===== BORROW ===== */

    /// @dev Lock collateral ERC20 to the pool contract to receive asset ERC20 and collateralized debt ERC721 by the borrower
    /// @dev Must atomically increase the collateral ERC20 balance of the pool contract with a transaction before calling the borrow function
    /// @dev Increasing the collateral ERC20 balance of the pool contract before calling this function will determine the collateralIn parameter
    /// @param _to The receiver of the borrow function
    /// @param _assetReceived The amount of asset ERC20 received by the receiver
    /// @param _bondIncrease The increase in the Y pool
    /// @param _rateIncrease The increase in the Z pool
    /// @return _tokenId The id of the newly minted collateralized debt ERC721 token contract
    /// @return _collateralLocked The amount of collateral ERC20 to be locked
    /// @return _debtRequired The amount of debt received by the receiver
    function borrow(
        address _to,
        uint256 _assetReceived,
        uint256 _bondIncrease,
        uint256 _rateIncrease
    )
        external
        override
        reentrancyLock()
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequired
        )
    {
        require(
            block.timestamp < maturity,
            "TimeswapPool :: borrow : Pool Matured"
        );
        require(
            _assetReceived > 0,
            "TimeswapPool :: borrow : Insufficient Asset Output Amount"
        );
        // It is impossible for either bond pool or rate pool to not increase as it will result in infinite debt required or infinite collateral locked
        require(
            _bondIncrease > 0 && _rateIncrease > 0,
            "TimeswapPool :: borrow : Insufficient Increase"
        );
        require(
            totalSupply > 0,
            "TimeswapPool :: borrow : Total supply must not be Zero"
        );

        // Get the Y pool, and Z pool
        (
            uint256 _assetReserve,
            uint256 _bondReserve,
            uint256 _rateReserve
        ) = _viewReserves();

        // Transfer the asset ERC20 to the receiver
        uint256 _assetBalance = _transferAndBalanceOf(
            asset,
            _to,
            _assetReceived
        );

        // Check that the constant product formula is followed
        _checkInvarianceForBorrow(
            _assetBalance,
            _assetReserve,
            _bondReserve,
            _rateReserve,
            _bondIncrease,
            _rateIncrease
        );

        // Mint collateralized debt ERC721 to the receiver
        // Mint bond ERC20 and insurance ERC20 to the pool contract
        (_collateralLocked, _debtRequired) = _mintCollateralizedDebt(
            _to,
            _assetReceived,
            _bondIncrease,
            _rateIncrease,
            _assetBalance,
            _bondReserve,
            _rateReserve
        );
        _tokenId = collateralizedDebt.totalSupply();

        // Get the difference of the stored W pool and the collateral ERC20 balance of the pool contract to get the collateralIn
        // Check that there is enough collateralIn for collateral locked
        // Must precalculate the collateralIn with a convenience contract to avoid unecessary loss of collateral ERC20
        uint256 _collateralBalance = collateral.balanceOf(address(this));
        require(
            _collateralBalance.subOrZero(collateralReserve) >=
                _collateralLocked,
            "TimeswapPool :: borrow : Insufficient Collateral Input Amount"
        );

        // Update all the pools
        _updateReserves(
            _assetBalance,
            _collateralBalance,
            _rateReserve + _rateIncrease
        );

        emit Borrow(
            msg.sender,
            _to,
            _tokenId,
            _assetReceived,
            _collateralLocked,
            _debtRequired
        );
    }

    /// @dev Check the constant product formula is followed for a borrowing transaction
    function _checkInvarianceForBorrow(
        uint256 _assetBalance,
        uint256 _assetReserve,
        uint256 _bondReserve,
        uint256 _rateReserve,
        uint256 _bondIncrease,
        uint256 _rateIncrease
    ) private view {
        uint256 _transactionFeeBase = BASE - transactionFee; // gas saving

        // Adjust the bond and rate increase to enforce the transaction fee to the liquidity provider
        uint256 _bondBalanceAdjusted = _tokenIncreaseAdjust(
            _bondIncrease,
            _bondReserve,
            _transactionFeeBase
        );
        uint256 _rateBalanceAdjusted = _tokenIncreaseAdjust(
            _rateIncrease,
            _rateReserve,
            _transactionFeeBase
        );
        // Check the constant product formula is followed
        // _bondIncrease and _rateIncrease must be precalculated by a convenience contract
        ConstantProduct.check(
            _assetBalance,
            _bondBalanceAdjusted * _rateBalanceAdjusted,
            _assetReserve,
            _bondReserve * _rateReserve
        );
    }

    /// @dev Adjust the bond and rate increase for the borrowing transaction
    /// @dev returns value adjusted with base precision
    function _tokenIncreaseAdjust(
        uint256 _tokenIncrease,
        uint256 _tokenReserve,
        uint256 _transactionFeeBase
    ) private pure returns (uint256 _tokenBalanceAdjusted) {
        // Adjust all value with the base precision
        _tokenBalanceAdjusted += _tokenReserve * BASE;
        _tokenBalanceAdjusted += _tokenIncrease * _transactionFeeBase;
        _tokenBalanceAdjusted /= BASE;
    }

    /// @dev Mint collateralized debt ERC721 to the receiver
    /// @dev Mint bond ERC20 and insurance ERC20 to the pool contract
    function _mintCollateralizedDebt(
        address _to,
        uint256 _assetReceived,
        uint256 _bondIncrease,
        uint256 _rateIncrease,
        uint256 _assetBalance,
        uint256 _bondReserve,
        uint256 _rateReserve
    ) private returns (uint256 _collateralLocked, uint256 _debtRequired) {
        uint256 _duration = maturity - block.timestamp; // gas saving

        // Calculate the collateral locked and debt required for the collateralized debt ERC721 based on the bond increase and rate increase
        _collateralLocked = _calculateCollateralLocked(
            _assetReceived,
            _bondIncrease,
            _assetBalance,
            _bondReserve,
            _rateReserve,
            _duration
        );
        _debtRequired = _calculateDebtRequired(
            _assetReceived,
            _rateIncrease,
            _assetBalance,
            _rateReserve,
            _duration
        );

        // Get the amount of insurance increase of the pool contract from rate increase multiply by duration from now to the maturity of the pool
        uint256 _insuranceIncrease = (_rateIncrease * _duration).divUp(YEAR);

        // Mint bond ERC20 and insurance ERC20 to the pool contract
        bond.mint(address(this), _bondIncrease);
        insurance.mint(address(this), _insuranceIncrease);
        // Mint collateralized debt ERC721 to the receiver
        collateralizedDebt.mint(_to, _collateralLocked, _debtRequired);
    }

    /// @dev Calculate the collateral locked for the collateralized debt ERC721
    function _calculateCollateralLocked(
        uint256 _assetReceived,
        uint256 _bondIncrease,
        uint256 _assetBalance,
        uint256 _bondReserve,
        uint256 _rateReserve,
        uint256 _duration
    ) private pure returns (uint256 _collateralLocked) {
        (uint256 _bondMax, uint256 _bondMaxUp) = (_assetReceived * _bondReserve).divDownAndUp(
            _assetBalance
        );

        // Use round down and round up in division to maximize the return to the pool contract
        _collateralLocked = (_bondMaxUp * _bondIncrease).divUp(
            _bondMax - _bondIncrease
        );
        _collateralLocked = (_collateralLocked * _rateReserve).divUp(
            _assetBalance + _assetReceived
        );
        _collateralLocked = (_collateralLocked * _duration).divUp(YEAR);
        _collateralLocked += _bondMaxUp;

        require(
            _collateralLocked <= MAXIMUM_BALANCE,
            "Timeswap :: _updateBondForBorrow : Collateral Overflow"
        );
    }

    /// @dev Calculate the debt required for the collateralized debt ERC721
    function _calculateDebtRequired(
        uint256 _assetReceived,
        uint256 _rateIncrease,
        uint256 _assetBalance,
        uint256 _rateReserve,
        uint256 _duration
    ) private pure returns (uint256 _debtRequired) {
        (uint256 _rateMax, uint256 _rateMaxUp) = (_assetReceived * _rateReserve).divDownAndUp(
            _assetBalance
        );
        
        // Use round down and round up in division to maximize the return to the pool contract
        _debtRequired = (_rateMaxUp * _rateIncrease).divUp(
            _rateMax - _rateIncrease
        );
        _debtRequired = (_debtRequired * _duration).divUp(YEAR);
        _debtRequired += _assetReceived;

        require(
            _debtRequired <= MAXIMUM_BALANCE,
            "Timeswap :: _updateInsuranceForBorrow : Debt Overflow"
        );
    }

    /* ===== WITHDRAW ===== */

    /// @dev Burn bond ERC20 and insurance ERC20 to withdraw asset ERC20 and collateral ERC20 respectively by the lender
    /// @param _to The receiver of the withdraw function
    /// @param _bondIn The amount of bond ERC20 to be burnt by the lender
    /// @param _insuranceIn The amount of insurance ERC20 to be burnt by the lender
    /// @return _assetReceived The amount of asset ERC20 received by the receiver
    /// @return _collateralReceived The amount of collateral ERC20 received by the receiver
    function withdraw(
        address _to,
        uint256 _bondIn,
        uint256 _insuranceIn
    )
        external
        override
        reentrancyLock()
        returns (uint256 _assetReceived, uint256 _collateralReceived)
    {
        require(
            block.timestamp >= maturity,
            "TimeswapPool :: withdraw : Pool Not Matured"
        );
        require(
            _bondIn > 0 || _insuranceIn > 0,
            "TimeswapPool :: withdraw : Insufficient Input Amount"
        );
        require(_to != address(this), "TimeswapPool :: withdraw : Invalid To");

        // Get the amount of asset ERC20 received and collateral ERC20 received based on the proportion of bond ERC20 burnt and insurance ERC20 burnt respectively
        _assetReceived = _bondIn > 0
            ? _swapProportional(bond, asset, _to, _bondIn)
            : 0;
        _collateralReceived = _insuranceIn > 0
            ? _swapProportional(insurance, collateral, _to, _insuranceIn)
            : 0;

        emit Withdraw(
            msg.sender,
            _to,
            _bondIn,
            _insuranceIn,
            _assetReceived,
            _collateralReceived
        );
    }

    /// @dev Calculate ERC20 received based on the proportion of native ERC20 burnt to the total supply
    function _swapProportional(
        InterfaceTimeswapERC20 _timeswapToken,
        InterfaceERC20 _token,
        address _to,
        uint256 _timeswapTokenIn
    ) private returns (uint256 _tokenOut) {
        // Get the total supply of the native token
        uint256 _timeswapTokenBalance = _timeswapToken.totalSupply();

        // Get the ERC20 balance of the pool contract, capped to uint128
        // Get the correct proportion of ERC20 received
        _tokenOut = _token.balanceOf(address(this));
        _tokenOut = _tokenOut >= MAXIMUM_BALANCE ? MAXIMUM_BALANCE : _tokenOut;
        _tokenOut *= _timeswapTokenIn;
        _tokenOut /= _timeswapTokenBalance;

        // Transfer the ERC20 to the receiver
        // Burn the native ERC20
        _safeTransfer(_token, _to, _tokenOut);
        _timeswapToken.burn(msg.sender, _timeswapTokenIn);
    }

    /* ===== PAY ===== */

    /// @dev Pay asset ERC20 to the pool to pay back the debt of collateralized debt ERC721 and withdraw locked collateral by the borrower
    /// @dev Proportionally unlock and transfer collateral ERC20 back to the owner of collateralized debt ERC721
    /// @dev Must atomically increase the asset ERC20 balance of the pool contract with a transaction before calling the pay function
    /// @dev Increasing the asset ERC20 balance of the pool contract before calling this function will determine the assetIn parameter
    /// @param _to The receiver of the pay function
    /// @param _tokenId The id of the collateralized debt ERC721
    /// @return _collateralReceived The collateral ERC20 received by the owner of collateralized debt ERC721
    function pay(
        address _to,
        uint256 _tokenId
    )
        external
        override
        reentrancyLock()
        returns (uint256 _collateralReceived)
    {
        require(
            block.timestamp < maturity,
            "TimeswapPool :: pay : Pool Matured"
        );

        InterfaceTimeswapERC721 _collateralizedDebt = collateralizedDebt; // gas saving

        // Get the difference of the stored X pool and the asset ERC20 balance of the pool contract to get the _assetIn
        // _assetIn is the increase in the X pool
        uint256 _assetBalance = asset.balanceOf(address(this));
        uint256 _assetIn = _assetBalance.subOrZero(uint256(assetReserve));

        // Get the collateral locked and asset debt information from the collateralized debt ERC721
        (uint128 _tokenCollateral, uint128 _tokenDebt) = _collateralizedDebt.collateralizedDebtOf(_tokenId);

        // Calculate collateral ERC20 received by the borrower based on assetIn amount
        // Capped the assetIn at the debt required from the collateralized debt ERC721
        // Must precalculate the assetIn with a convenience contract to avoid unecessary loss of asset ERC20
        (_assetIn, _collateralReceived) = _assetIn >= _tokenDebt
            ? (_tokenDebt, _tokenCollateral)
            : (_assetIn, _assetIn * _tokenCollateral / _tokenDebt);
        
        // Get the owner of the collateralized debt ERC721
        // Transfer the collateral received to the owner
        address _owner = _collateralizedDebt.ownerOf(_tokenId);

        _collateralReceived = _owner == msg.sender ? _collateralReceived : 0;
        _collateralizedDebt.burn(_tokenId, _collateralReceived, _assetIn);

        uint256 _collateralBalance;
        if (_collateralReceived > 0)
            _collateralBalance = _transferAndBalanceOf(collateral, _to, _collateralReceived);

        // Update all the pools
        // The pay function simply increase the X pool and decrease the W pool which means the Z virtual pool for the next transaction decreases
        _updateReserves(_assetBalance, _collateralBalance, rateReserve);

        emit Pay(msg.sender, _to, _tokenId, _assetIn, _collateralReceived);
    }

    /* ===== SKIM ===== */

    /// @dev Force balances to match reserves
    /// @dev The solution to withdraw excess asset ERC20 and collateral ERC20
    /// @param _to The receiver of the skim function
    function skim(address _to) external override reentrancyLock() {
        InterfaceERC20 _asset = asset; // gas saving
        InterfaceERC20 _collateral = collateral; // gas saving

        // Get the difference to the stored pools amount to get the excess ERC20
        uint256 _assetOut = _asset.balanceOf(address(this)).subOrZero(
            assetReserve
        );
        uint256 _collateralOut = _collateral.balanceOf(address(this)).subOrZero(
            collateralReserve
        );

        // Transfer the excess ERC20 to the receiver
        if (_assetOut > 0) _safeTransfer(_asset, _to, _assetOut);
        if (_collateralOut > 0) _safeTransfer(_collateral, _to, _collateralOut);
    }
}
