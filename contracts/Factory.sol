// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IFactory} from './interfaces/IFactory.sol';
import {IPair} from './interfaces/IPair.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {Math} from './libraries/Math.sol';
import {Pair} from './Pair.sol';

contract Factory is IFactory {
    using Math for uint256;

    address public override owner;
    address public override pendingOwner;
    uint16 public immutable override fee;
    uint16 public immutable override protocolFee;

    mapping(IERC20 => mapping(IERC20 => IPair)) public override getPool;

    constructor(
        address _owner,
        uint16 _fee,
        uint16 _protocolFee
    ) {
        require(_owner != address(0), 'TimeswapFactory :: constructor : Cannot be Zero Address');
        owner = _owner;
        fee = _fee;
        protocolFee = _protocolFee;
    }

    function createPool(IERC20 _asset, IERC20 _collateral) external override returns (IPair _pool) {
        require(_asset != _collateral, 'TimeswapFactory :: createPool : Identical Address');
        require(
            _asset != IERC20(address(0)) && _collateral != IERC20(address(0)),
            'TimeswapFactory :: createPool : Zero Address'
        );
        require(getPool[_asset][_collateral] == IPair(address(0)), 'TimeswapFactory :: createPool : Pool Exists');

        IPair _pair = IPair(
            new Pair{salt: keccak256(abi.encode(_asset, _collateral, fee, protocolFee))}(
                _asset,
                _collateral,
                fee,
                protocolFee
            )
        );

        getPool[_asset][_collateral] = _pair;

        emit PoolCreated(_asset, _collateral, _pair);

        return _pair;
    }

    function setOwner(address _owner) external override {
        require(msg.sender == owner, 'TimeswapFactory :: setOwner : Forbidden');
        require(_owner != address(0), 'TimeswapFactory :: setOwner : Zero Address');
        pendingOwner = _owner;
    }

    function acceptOwner() external override {
        require(msg.sender == pendingOwner, 'TimeswapFactory :: acceptOwner : Forbidden');
        owner = msg.sender;
    }
}
