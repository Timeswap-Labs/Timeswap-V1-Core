// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceTimeswapPool} from './InterfaceTimeswapPool.sol';
import {IERC20Metadata} from '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import {InterfaceTimeswapERC20} from './InterfaceTimeswapERC20.sol';
import {InterfaceTimeswapERC721} from './InterfaceTimeswapERC721.sol';

interface InterfaceTimeswapFactory {
    // EVENT

    event PoolCreated(
        IERC20Metadata indexed _asset,
        IERC20Metadata indexed _collateral,
        uint256 _maturity,
        InterfaceTimeswapPool _pool
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
        IERC20Metadata _asset,
        IERC20Metadata _collateral,
        uint256 _maturity
    ) external view returns (InterfaceTimeswapPool);

    // UPDATE

    function createPool(
        IERC20Metadata _asset,
        IERC20Metadata _collateral,
        uint256 _maturity
    ) external returns (InterfaceTimeswapPool _pool);

    function setFeeTo(address _feeTo) external;

    function setFeeToSetter(address _feeToSetter) external;
}
