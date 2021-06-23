// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceERC165} from './interfaces/InterfaceERC165.sol';
import {InterfaceERC721} from './interfaces/InterfaceERC721.sol';
import {InterfaceERC721Receiver} from './interfaces/InterfaceERC721Receiver.sol';

/// @title ERC721
/// @author Ricsson W. Ngo
/// @dev This contract follows the ERC721 standard
contract ERC721 is InterfaceERC721 {
    /* ===== MODEL ===== */

    bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;
    address private constant ZERO = address(type(uint160).min);

    uint256 internal tokenId;

    mapping(address => uint256) internal _balanceOf;
    mapping(uint256 => address) internal _ownerOf;
    mapping(uint256 => address) internal _getApproved;
    mapping(address => mapping(address => bool)) internal _isApprovedForAll;

    modifier isApprovedOrOwner(address _owner, uint256 _tokenId) {
        require(
            _owner == msg.sender || _getApproved[_tokenId] == msg.sender || _isApprovedForAll[_owner][msg.sender],
            'ERC721 :: isApprovedOrOwner : Transfer caller is not owner nor approved'
        );
        _;
    }

    /* ===== VIEW ===== */

    function supportsInterface(bytes4 interfaceID) external pure override returns (bool) {
        return interfaceID == _INTERFACE_ID_ERC165 || interfaceID == _INTERFACE_ID_ERC721;
    }

    function balanceOf(address _owner) external view override returns (uint256) {
        require(_owner != ZERO, 'ERC721 :: balanceOf : Balance query for the zero address');
        return _balanceOf[_owner];
    }

    function ownerOf(uint256 _tokenId) external view override returns (address) {
        require(_ownerOf[_tokenId] != ZERO, 'ERC721 :: ownerOf : Owner query for the zero address');
        return _ownerOf[_tokenId];
    }

    function getApproved(uint256 _tokenId) external view override returns (address) {
        require(_ownerOf[_tokenId] != ZERO, 'ERC721 :: getApproved : Approve query for the zero address');
        return _getApproved[_tokenId];
    }

    function isApprovedForAll(address _owner, address _operator) external view override returns (bool) {
        return _isApprovedForAll[_owner][_operator];
    }

    /* ===== UPDATE ===== */

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external override isApprovedOrOwner(_ownerOf[_tokenId], _tokenId) {
        _safeTransfer(_from, _to, _tokenId, '');
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) external override isApprovedOrOwner(_ownerOf[_tokenId], _tokenId) {
        _safeTransfer(_from, _to, _tokenId, _data);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external override isApprovedOrOwner(_ownerOf[_tokenId], _tokenId) {
        _transfer(_from, _to, _tokenId);
    }

    function approve(address _to, uint256 _tokenId) external override {
        address _owner = _ownerOf[_tokenId];
        require(
            _owner == msg.sender || _isApprovedForAll[_owner][msg.sender],
            'ERC721 :: approve : Approve caller is not owner nor approved for all'
        );
        require(_to != _owner, 'ERC721 :: approve : Approval to current owner');
        _approve(_to, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) external override {
        require(_operator != msg.sender, 'ERC721 :: setApprovalForAll : Approve to caller');
        _setApprovalForAll(_operator, _approved);
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /* ===== HELPER ===== */

    function _safeTransfer(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) private {
        _transfer(_from, _to, _tokenId);
        require(_checkOnERC721Received(_from, _to, _tokenId, _data), 'ERC721 :: _safeTransfer : Not Safe Transfer');
    }

    function _approve(address _approved, uint256 _tokenId) private {
        _getApproved[_tokenId] = _approved;
        emit Approval(_ownerOf[_tokenId], _approved, _tokenId);
    }

    function _setApprovalForAll(address _operator, bool _approved) private {
        _isApprovedForAll[msg.sender][_operator] = _approved;
    }

    function _safeMint(address _to, uint256 _tokenId) internal virtual {
        _mint(_to, _tokenId);
        require(
            _checkOnERC721Received(ZERO, _to, _tokenId, ''),
            'ERC721 :: _safeMint : Transfer to non ERC721Receiver implementer'
        );
    }

    function _mint(address _to, uint256 _tokenId) private {
        require(_to != ZERO, 'ERC721 :: _mint : Mint to the zero address');
        require(_ownerOf[_tokenId] == ZERO, 'ERC721 :: _mint : Already minted');

        _balanceOf[_to] += 1;
        _ownerOf[_tokenId] = _to;

        emit Transfer(ZERO, _to, _tokenId);
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) private {
        require(_to != ZERO, 'ERC721 :: _transfer : Transfer to the zero address');

        _ownerOf[_tokenId] = _to;
        _balanceOf[_from] -= 1;
        _balanceOf[_to] += 1;
        _getApproved[_tokenId] = ZERO;

        emit Transfer(_from, _to, _tokenId);
    }

    function _checkOnERC721Received(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) private returns (bool) {
        uint256 _size;
        assembly {
            _size := extcodesize(_to)
        }
        if (_size == 0) {
            return true;
        } else {
            bytes memory _returnData;
            (bool _success, bytes memory _return) = _to.call(
                abi.encodeWithSelector(
                    InterfaceERC721Receiver(_to).onERC721Received.selector,
                    msg.sender,
                    _from,
                    _tokenId,
                    _data
                )
            );
            if (_success) {
                _returnData = _return;
            } else if (_return.length > 0) {
                assembly {
                    let _returnDataSize := mload(_return)
                    revert(add(32, _return), _returnDataSize)
                }
            } else {
                revert('ERC721 :: _checkOnERC721Received : Transfer to non ERC721Receiver implementer');
            }
            bytes4 _retval = abi.decode(_returnData, (bytes4));
            return (_retval == 0x150b7a02);
        }
    }
}
