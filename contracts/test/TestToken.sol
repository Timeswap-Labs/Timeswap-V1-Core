// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

contract TestToken {
    // MODEL

    string public constant name = 'Test Token';
    string public constant symbol = 'TEST';
    uint8 public immutable decimals;

    address private constant ZERO = address(type(uint160).min);

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // EVENT

    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    // INIT

    constructor(uint8 _decimals) {
        decimals = _decimals;
    }

    // UPDATE

    function approve(address _spender, uint256 _value) external returns (bool) {
        _approve(msg.sender, _spender, _value);
        return true;
    }

    function transfer(address _to, uint256 _value) external returns (bool) {
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool) {
        if (allowance[_from][msg.sender] >= _value) {
            allowance[_from][msg.sender] -= _value;

            emit Approval(_from, msg.sender, allowance[_from][msg.sender]);
            _transfer(_from, _to, _value);
            return true;
        }
        
        return false;
    }

    function mint(address _to, uint256 _value) external {
        totalSupply += _value;
        balanceOf[_to] += _value;
        emit Transfer(ZERO, _to, _value);
    }

    // HELPER

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
        emit Transfer(_from, _to, _value);
    }
}
