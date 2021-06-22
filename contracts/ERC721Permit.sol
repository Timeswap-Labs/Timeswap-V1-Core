// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {InterfaceERC721Permit} from "./interfaces/InterfaceERC721Permit.sol";
import {ERC721} from "./ERC721.sol";

/// @title ERC721 Permit
/// @author Ricsson W. Ngo
/// @dev This contract follows the ERC721 standard
/// @dev This contract implements the permit function
contract ERC721Permit is InterfaceERC721Permit, ERC721 {
    using ECDSA for bytes32;

    /* ===== MODEL ===== */

    bytes32 public constant override DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,uint256 chainId,address verifyingContract)"
        );
    bytes32 public constant override PERMIT_TYPEHASH =
        keccak256(
            "Permit(address approved,uint256 tokenId,uint256 nonce,uint256 deadline)"
        );

    bytes32 public override DOMAIN_SEPARATOR; // immutable

    mapping(address => uint256) public override nonces;

    /* ===== UPDATE ===== */

    function permit(
        address _approved,
        uint256 _tokenId,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external override {
        address _owner = _ownerOf[_tokenId];
        bytes32 _structHash = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                _approved,
                _tokenId,
                nonces[_owner]++,
                _deadline
            )
        );
        bytes32 _digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, _structHash)
        );
        address _signatory = _digest.recover(_v, _r, _s);
        require(_signatory == _owner, "ERC721Permit :: permit : Unauthorized");
        require(
            block.timestamp <= _deadline,
            "ERC721Permit :: permit : Signature Expired"
        );

        require(
            _approved != _owner,
            "ERC721Permit :: permit : Approval to current owner"
        );

        _getApproved[_tokenId] = _approved;

        emit Approval(_owner, _approved, _tokenId);
    }

    //* ===== HELPER ===== */

    function _setDomainSeparator(string memory _name) internal {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(_name)),
                chainId,
                address(this)
            )
        );
    }
}
