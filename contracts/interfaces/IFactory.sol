// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;
import {IPair} from './IPair.sol';
import {IERC20} from './IERC20.sol';

interface IFactory {
    // EVENT

    event CreatePair(IERC20 indexed asset, IERC20 indexed collateral, IPair pair);

    event SetOwner(address indexed pendingOwner);

    event AcceptOwner(address indexed owner);

    // VIEW

    function owner() external view returns (address);

   function pendingOwner() external view returns (address);

    function fee() external view returns (uint16);

    function protocolFee() external view returns (uint16);

    function getPair(IERC20 asset, IERC20 collateral) external view returns (IPair pair);

    // UPDATE

    function createPair(IERC20 asset, IERC20 collateral) external returns (IPair pair);

    function setOwner(address _pendingOwner) external;

    function acceptOwner() external;
}