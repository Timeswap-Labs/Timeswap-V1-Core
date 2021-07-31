// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IFactory} from './interfaces/IFactory.sol';
import {IPair} from './interfaces/IPair.sol';
import {IERC20} from './interfaces/IERC20.sol';

import {Pair} from './Pair.sol';

contract Factory is IFactory {
    address public override owner;
    address public override pendingOwner;
    uint16 public immutable override fee;
    uint16 public immutable override protocolFee;

    mapping(IERC20 => mapping(IERC20 =>  IPair))
        public
        override getPool;
    mapping(IERC20 => mapping(IERC20 => IPair)) public override getPair;

    constructor(
        address _owner,
        uint16 _fee,
        uint16 _protocolFee
    ) {
        require(_owner != address(0), 'Zero');
        owner = _owner;
        fee = _fee;
        protocolFee = _protocolFee;
    }


    function createPair(IERC20 asset, IERC20 collateral) external override returns (IPair pair) {
        require(asset != collateral, 'Identical');
        require(asset != IERC20(address(0)) && collateral != IERC20(address(0)), 'Zero');
        require(getPair[asset][collateral] == IPair(address(0)), 'Exist');

        pair = new Pair{salt: keccak256(abi.encode(asset, collateral))}(asset, collateral, fee, protocolFee);

        getPair[asset][collateral] = pair;

        emit CreatePair(asset, collateral, pair);
    }

    function setOwner(address _pendingOwner) external override {
        require(msg.sender == owner, 'Forbidden');
        require(_pendingOwner != address(0), 'Zero');
        pendingOwner = _pendingOwner;

        emit SetOwner(_pendingOwner);
    }

    function acceptOwner() external override {
        require(msg.sender == pendingOwner, 'Forbidden');
        owner = msg.sender;

        emit AcceptOwner(msg.sender);
    }
}
