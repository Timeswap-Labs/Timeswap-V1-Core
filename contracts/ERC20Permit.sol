// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {ECDSA} from '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import {InterfaceERC20Permit} from './interfaces/InterfaceERC20Permit.sol';
import {ERC20} from './ERC20.sol';

/// @title ERC20 Permit
/// @author Ricsson W. Ngo
/// @dev This contract follows the ERC20 standard
/// @dev This contract implements the permit function
contract ERC20Permit is InterfaceERC20Permit, ERC20 {
    using ECDSA for bytes32;

    /* ===== MODEL ===== */

    bytes32 public constant override DOMAIN_TYPEHASH =
        keccak256('EIP712Domain(string name,uint256 chainId,address verifyingContract)');
    bytes32 public constant override PERMIT_TYPEHASH =
        keccak256('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)');

    function DOMAIN_SEPARATOR() public view override returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(DOMAIN_NAME)), block.chainid, address(this)));
    }
    string public DOMAIN_NAME;

    mapping(address => uint256) public override nonces;

    /* ===== UPDATE ===== */

    function permit(
        address _owner,
        address _spender,
        uint256 _value,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external override {
        bytes32 _structHash = keccak256(
            abi.encode(PERMIT_TYPEHASH, _owner, _spender, _value, nonces[_owner]++, _deadline)
        );
        bytes32 _digest = keccak256(abi.encodePacked('\x19\x01', DOMAIN_SEPARATOR(), _structHash));
        address _signatory = _digest.recover(_v, _r, _s);
        require(_signatory == _owner, 'ERC20Permit :: permit : Unauthorized');
        require(block.timestamp <= _deadline, 'ERC20Permit :: permit : Signature Expired');

        allowance[_owner][_spender] = _value;

        emit Approval(_owner, _spender, _value);
    }

    /* ===== HELPER ===== */

    function _setDomainName(string memory _name) internal {
        DOMAIN_NAME = _name;
    }


}
