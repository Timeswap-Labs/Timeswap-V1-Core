// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceERC20Permit} from './InterfaceERC20Permit.sol';
import {InterfaceTimeswapPool} from './InterfaceTimeswapPool.sol';

interface InterfaceTimeswapERC20 is InterfaceERC20Permit {
    // VIEW

    function pool() external view returns (InterfaceTimeswapPool);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    // UPDATE

    function initialize(string memory _symbol, uint8 _decimals) external;

    function mint(address _to, uint256 _value) external;

    function burn(address _from, uint256 _value) external;
}
