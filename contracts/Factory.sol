// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IFactory} from './interfaces/IFactory.sol';
import {IPair} from './interfaces/IPair.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {Pair} from './Pair.sol';

/// @title Timeswap Factory
/// @author Timeswap Labs
/// @notice It is recommnded to use Timeswap Convenience to interact with this contract.
/// @notice All error messages are abbreviated and can be found in the documentation.
contract Factory is IFactory {
    /* ===== MODEL ===== */
    
    /// @dev The address that receives the protocol fee.
    address public override owner;
    /// @dev The new pending address to replace the owner.
    address public override pendingOwner;
    /// @dev The fee earned by liquidity providers. Follows UQ0.16 format.
    uint16 public immutable override fee;
    /// @dev The protocol fee earned by the owner. Follows UQ0.16 format.
    uint16 public immutable override protocolFee;

    /// @dev Stores all the address of deployed pairs in a mapping.
    mapping(IERC20 => mapping(IERC20 => IPair)) public override getPair;

    /* ===== INIT ===== */

    /// @param _owner The chosen owner address.
    /// @param _fee The chosen fee rate.
    /// @param _protocolFee The chosen protocol fee rate.
    constructor(
        address _owner,
        uint16 _fee,
        uint16 _protocolFee
    ) {
        require(_owner != address(0), 'Zero');
        owner = _owner;
        fee = _fee;
        protocolFee = _protocolFee;
    }

    /* ===== UPDATE ===== */

    /// @dev Creates a Timeswap Pool based on ERC20 pair parameters.
    /// @dev Cannot create a Timeswap Pool with the same pair parameters.
    /// @param asset The address of the ERC20 being lent and borrowed.
    /// @param collateral The address of the ERC20 as the collateral.
    function createPair(IERC20 asset, IERC20 collateral) external override returns (IPair pair) {
        require(asset != collateral, 'Identical');
        require(asset != IERC20(address(0)) && collateral != IERC20(address(0)), 'Zero');
        require(getPair[asset][collateral] == IPair(address(0)), 'Exist');

        pair = new Pair{salt: keccak256(abi.encode(asset, collateral))}(asset, collateral, fee, protocolFee);

        getPair[asset][collateral] = pair;

        emit CreatePair(asset, collateral, pair);
    }

    /// @dev Set the pending owner of the factory.
    /// @dev Can only be called by the current owner.
    /// @param _pendingOwner the chosen pending owner.
    function setOwner(address _pendingOwner) external override {
        require(msg.sender == owner, 'Forbidden');
        require(_pendingOwner != address(0), 'Zero');
        pendingOwner = _pendingOwner;

        emit SetOwner(_pendingOwner);
    }

    /// @dev Set the pending owner as the owner of the factory.
    /// @dev Can only be called by the pending owner.
    function acceptOwner() external override {
        require(msg.sender == pendingOwner, 'Forbidden');
        owner = msg.sender;

        emit AcceptOwner(msg.sender);
    }
}
