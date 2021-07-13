// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceTimeswapPool} from './InterfaceTimeswapPool.sol';
import {InterfaceERC20} from './InterfaceERC20.sol';
import {InterfaceTimeswapERC20} from './InterfaceTimeswapERC20.sol';
import {InterfaceTimeswapERC721} from './InterfaceTimeswapERC721.sol';

interface InterfaceTimeswapFactory {
    // EVENT

    event PoolCreated(
        InterfaceERC20 indexed _asset,
        InterfaceERC20 indexed _collateral,
        uint256 _maturity,
        InterfaceTimeswapPool _pool
    );

    event FeeAddressSet(
        address indexed _feeTo
    );

    event FeeAddressSetterSet(
        address indexed oldFeeToSetter,
        address indexed newFeeToSetter
    );

    // VIEW

    function pool() external view returns (InterfaceTimeswapPool);

    function bond() external view returns (InterfaceTimeswapERC20);

    function insurance() external view returns (InterfaceTimeswapERC20);

    function collateralizedDebt() external view returns (InterfaceTimeswapERC721);

    function feeTo() external view returns (address);

    function feeToSetter() external view returns (address);

    function transactionFee() external view returns (uint128);

    function protocolFee() external view returns (uint128);

    function getPool(
        InterfaceERC20 _asset,
        InterfaceERC20 _collateral,
        uint256 _maturity
    ) external view returns (InterfaceTimeswapPool);

    // UPDATE

    function createPool(
        InterfaceERC20 _asset,
        InterfaceERC20 _collateral,
        uint256 _maturity
    ) external returns (InterfaceTimeswapPool _pool);

    function setFeeTo(address _feeTo) external;

    function setFeeToSetter(address _feeToSetter) external;
}
