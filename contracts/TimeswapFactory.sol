// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {Clones} from '@openzeppelin/contracts/proxy/Clones.sol';
import {InterfaceTimeswapFactory} from './interfaces/InterfaceTimeswapFactory.sol';
import {InterfaceTimeswapPool} from './interfaces/InterfaceTimeswapPool.sol';
import {InterfaceERC20} from './interfaces/InterfaceERC20.sol';
import {InterfaceTimeswapERC20} from './interfaces/InterfaceTimeswapERC20.sol';
import {InterfaceTimeswapERC721} from './interfaces/InterfaceTimeswapERC721.sol';
import {Math} from './libraries/Math.sol';
import {String} from './libraries/String.sol';

/// @title Timeswap Factory
/// @author Ricsson W. Ngo
/// @notice It is recommended to use Timeswap Convenience Contracts to interact with this contract
/// @dev The factory implements the minimal proxy contract standard to save gas for each deployment
contract TimeswapFactory is InterfaceTimeswapFactory {
    using Math for uint256;
    using String for uint256;
    using Clones for address;

    /* ===== MODEL ===== */

    address private constant ZERO = address(type(uint160).min);

    /// @dev The address that receives the protocol fee from the deployed pools
    address public override feeTo;
    /// @dev The address that can change the feeTo address
    address public override feeToSetter;

    /// @dev The address of the original TimeswapPool contract to clone from
    InterfaceTimeswapPool public immutable override pool;

    /// @dev The addresses of the orginal native ERC20 and ERC721 contracts to clone from
    InterfaceTimeswapERC20 public immutable override bond;
    InterfaceTimeswapERC20 public immutable override insurance;
    InterfaceTimeswapERC721 public immutable override collateralizedDebt;

    /// @dev The fee rates for all deployed pools
    uint128 public immutable override transactionFee;
    uint128 public immutable override protocolFee;
    uint256 private constant BASE = 10000;

    /// @dev Stores all the address of the deployed pools in a mapping
    mapping(InterfaceERC20 => mapping(InterfaceERC20 => mapping(uint256 => InterfaceTimeswapPool)))
        public
        override getPool;

    /* ===== INIT ===== */

    /// @dev First deploy the TimeswapPool contract as the original contract
    /// @dev Then deploy the three native ERC20 and ERC721 contracts as original contracts
    /// @dev Then finally deploy the Timeswap Factory with the given correct addresses
    /// @dev The fee rates cannot be greater than the precision BASE
    /// @param _feeTo The chosen feeTo address
    /// @param _feeToSetter The chosen feeToSetter address
    /// @param _pool The address of the original TimeswapPool contract
    /// @param _bond The address of the original Bond ERC20 contract
    /// @param _insurance The address of the original Insurance ERC20 contract
    /// @param _collateralizedDebt The address of the original Collateralized Debt ERC721 contract
    /// @param _transactionFee The chosen transaction fee for all deployed pools
    /// @param _protocolFee The chosen protocol fee for all deployed pools
    constructor(
        address _feeTo,
        address _feeToSetter,
        InterfaceTimeswapPool _pool,
        InterfaceTimeswapERC20 _bond,
        InterfaceTimeswapERC20 _insurance,
        InterfaceTimeswapERC721 _collateralizedDebt,
        uint128 _transactionFee,
        uint128 _protocolFee
    ) {
        // Sanity checks
        require(_feeTo != ZERO && _feeToSetter != ZERO, 'TimeswapFactory :: constructor : Cannot be Zero Address');
        feeTo = _feeTo;
        feeToSetter = _feeToSetter;

        require(_pool != InterfaceTimeswapPool(ZERO), 'TimeswapFactory :: constructor : Cannot be Zero Address');
        pool = _pool;

        require(_bond != InterfaceTimeswapERC20(ZERO), 'TimeswapFactory :: constructor : Cannot be Zero Address');
        require(_insurance != InterfaceTimeswapERC20(ZERO), 'TimeswapFactory :: constructor : Cannot be Zero Address');
        require(_bond != _insurance, 'TimeswapPool :: initialize : Cannot be the same address');
        require(
            _collateralizedDebt != InterfaceTimeswapERC721(ZERO),
            'TimeswapFactory :: constructor : Cannot be Zero Address'
        );
        bond = _bond;
        insurance = _insurance;
        collateralizedDebt = _collateralizedDebt;

        // fee rates cannot be greater than precision BASE
        require(_transactionFee < BASE, 'TimeswapFactory :: constructor : Invalid Fee');
        require(_protocolFee < BASE, 'TimeswapFactory :: constructor : Invalid Fee');
        transactionFee = _transactionFee;
        protocolFee = _protocolFee;
    }

    /* ===== UPDATE ===== */

    /// @dev Creates a Timeswap pool based on the ERC20 being lent and borrowed, ERC20 being used as collateral, and a future maturity time in unix timestamp
    /// @dev Cannot create a Timeswap pool with the same parameters as an existing Timeswap pool
    /// @param _asset The address of the ERC20 being lent and borrowed (asset ERC20)
    /// @param _collateral The address of the ERC20 being used as collateral (collateral ERC20)
    /// @param _maturity The future maturity time in unix timestamp
    /// @return _pool The address of the newly deployed cloned Timeswap pool
    function createPool(
        InterfaceERC20 _asset,
        InterfaceERC20 _collateral,
        uint256 _maturity
    ) external override returns (InterfaceTimeswapPool _pool) {
        // Sanity checks
        require(_asset != _collateral, 'TimeswapFactory :: createPool : Identical Address');
        require(
            _asset != InterfaceERC20(ZERO) && _collateral != InterfaceERC20(ZERO),
            'TimeswapFactory :: createPool : Zero Address'
        );
        require(block.timestamp < _maturity, 'TimeswapFactory :: createPool : Invalid Maturity');
        require(
            getPool[_asset][_collateral][_maturity] == InterfaceTimeswapPool(ZERO),
            'TimeswapFactory :: createPool : Pool Existed'
        );

        // The salt is the keccak hash of the packed address of the asset ERC20, collateral ERC20, and the maturity time in string
        // Uses the create2 for predictable address using the correct salt
        bytes32 _salt = keccak256(abi.encodePacked(_asset, _collateral, _maturity.toString()));

        // Clone the original TimeswapPool contract based on the minimal proxy standard
        _pool = InterfaceTimeswapPool(address(pool).cloneDeterministic(_salt));

        // Initialize the newly deployed cloned TimeswapPool contract
        _pool.initialize(
            _asset,
            _collateral,
            _maturity,
            bond,
            insurance,
            collateralizedDebt,
            transactionFee,
            protocolFee
        );

        // Get the address of the newly deployed cloned TimeswapPool contract
        getPool[_asset][_collateral][_maturity] = _pool;

        emit PoolCreated(_asset, _collateral, _maturity, _pool);
    }

    /// @dev Change the feeTo address
    /// @param _feeTo The address of the new feeTo
    function setFeeTo(address _feeTo) external override {
        require(msg.sender == feeToSetter, 'TimeswapFactory :: setFeeTo : Forbidden');
        require(_feeTo != ZERO, 'TimeswapFactory :: setFeeTo : Zero Address');
        feeTo = _feeTo;
    }

    /// @dev Change the feeToSetter address
    /// @param _feeToSetter The address of the new feeToSetter
    function setFeeToSetter(address _feeToSetter) external override {
        require(msg.sender == feeToSetter, 'TimeswapFactory :: setFeeToSetter : Forbidden');
        require(_feeToSetter != ZERO, 'TimeswapFactory :: setFeeToSetter : Zero Address');
        feeToSetter = _feeToSetter;
    }
}
