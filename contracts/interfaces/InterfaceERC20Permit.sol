// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceERC20} from "./InterfaceERC20.sol";

interface InterfaceERC20Permit is InterfaceERC20 {
    // MODEL

    function DOMAIN_TYPEHASH() external view returns (bytes32);

    function PERMIT_TYPEHASH() external view returns (bytes32);

    function DOMAIN_SEPARATOR() external view returns (bytes32);

    function nonces(address _owner) external view returns (uint256);

    // UPDATE

    function permit(address _owner, address _spender, uint256 _value, uint256 _deadline, uint8 _v, bytes32 _r, bytes32 _s) external;
}
