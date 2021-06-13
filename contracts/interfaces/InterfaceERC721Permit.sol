// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceERC721} from "./InterfaceERC721.sol";

interface InterfaceERC721Permit is InterfaceERC721 {
    // MODEL

    function DOMAIN_TYPEHASH() external view returns (bytes32);

    function PERMIT_TYPEHASH() external view returns (bytes32);

    function DOMAIN_SEPARATOR() external view returns (bytes32);

    function nonces(address _owner) external view returns (uint256);

    // UPDATE

    function permit(address _approved, uint256 _tokenId, uint256 _deadline, uint8 _v, bytes32 _r, bytes32 _s) external;
}
