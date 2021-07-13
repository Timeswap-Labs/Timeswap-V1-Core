// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceTimeswapERC20} from './interfaces/InterfaceTimeswapERC20.sol';
import {InterfaceTimeswapPool} from './interfaces/InterfaceTimeswapPool.sol';
import {ERC20Permit} from './ERC20Permit.sol';

/// @title Timeswap ERC20
/// @author Ricsson W. Ngo
/// @dev This contract follows the ERC20 standard
/// @dev Only the Timeswap factory can call these functions
abstract contract TimeswapERC20 is InterfaceTimeswapERC20, ERC20Permit {
    /* ===== MODEL ===== */

    InterfaceTimeswapPool public override pool;

    uint8 public override decimals;

    /* ===== UPDATE ===== */

    function mint(address _to, uint256 _value) external override {
        require(InterfaceTimeswapPool(msg.sender) == pool, 'TimswapERC20 :: mint : Forbidden');
        _mint(_to, _value);
    }

    function burn(address _from, uint256 _value) external override {
        require(InterfaceTimeswapPool(msg.sender) == pool, 'TimeswapERC20 :: burn : Forbidden');
        _burn(_from, _value);
    }

    /* ===== HELPER ===== */

    function _initialize(string memory _name, uint8 _decimals) internal {
        require(pool == InterfaceTimeswapPool(address(type(uint160).min)), 'TimeswapERC20 :: _initialize : Forbidden');
        pool = InterfaceTimeswapPool(msg.sender);
        decimals = _decimals;

        _setDomainName(_name);
    }
}
