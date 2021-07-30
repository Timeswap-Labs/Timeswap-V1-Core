// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;
import {IPair} from './IPair.sol';
import {IERC20} from './IERC20.sol';

interface IFactory {
 // EVENT

    event PoolCreated(
        IERC20 indexed _asset,
        IERC20 indexed _collateral,
        IPair _pair
    );

    // VIEW


    function owner() external view returns (address);
    function pendingOwner() external view returns (address);

    function fee() external view returns (uint16);

    function protocolFee() external view returns (uint16);

    function getPool(
        IERC20 _asset,
        IERC20 _collateral
    ) external view returns (IPair);

    // UPDATE

    function createPool(
        IERC20 _asset,
        IERC20 _collateral
    ) external returns (IPair _pair);

    function setOwner(address _feeTo) external;

    function acceptOwner() external;
}