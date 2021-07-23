// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceERC20} from './interfaces/InterfaceERC20.sol';

/// @title ERC20
/// @author Ricsson W. Ngo
/// @dev This contract follows the ERC20 standard
contract ERC20 is InterfaceERC20 {
    /* ===== MODEL ===== */

    // Balances of each address is capped at uint128
    uint256 internal constant MAXIMUM_BALANCE = type(uint128).max;
    address internal constant ZERO = address(type(uint160).min);

    uint256 public override totalSupply;
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    /* ===== UPDATE ===== */

    function approve(address _spender, uint256 _value) external override returns (bool) {
        _approve(msg.sender, _spender, _value);
        return true;
    }

    function transfer(address _to, uint256 _value) external override returns (bool) {
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external override returns (bool) {
        if (msg.sender != _from && allowance[_from][msg.sender] != type(uint256).max) {
            allowance[_from][msg.sender] -= _value;

            emit Approval(_from, msg.sender, allowance[_from][msg.sender]);
        }
        _transfer(_from, _to, _value);
        return true;
    }

    function increaseAllowance(address _spender, uint256 _value) external returns (bool) {
        _approve(msg.sender, _spender, allowance[msg.sender][_spender] + _value);
        return true;
    }

    function decreaseAllowance(address _spender, uint256 _value) external returns (bool) {
        _approve(msg.sender, _spender, allowance[msg.sender][_spender] - _value);
        return true;
    }
    
    /* ===== HELPER ===== */

    function _mint(address _to, uint256 _value) internal {
        totalSupply += _value;
        balanceOf[_to] += _value;
        // Check if uint128 cap is followed
        if (_to != ZERO)
            require(
                balanceOf[_to] <= MAXIMUM_BALANCE,
                'ERC20 :: _mint : Address cannot have more than maximum balance'
            );
        emit Transfer(ZERO, _to, _value);
    }

    function _burn(address _from, uint256 _value) internal {
        balanceOf[_from] -= _value;
        totalSupply -= _value;
        emit Transfer(_from, ZERO, _value);
    }

    function _approve(
        address _owner,
        address _spender,
        uint256 _value
    ) private {
        allowance[_owner][_spender] = _value;
        emit Approval(_owner, _spender, _value);
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) private {
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        // Check if uint128 cap is followed
        if (_to != ZERO)
            require(
                balanceOf[_to] <= MAXIMUM_BALANCE,
                'ERC20 :: _transfer : Address cannot have more than maximum balance'
            );
        emit Transfer(_from, _to, _value);
    }
}
