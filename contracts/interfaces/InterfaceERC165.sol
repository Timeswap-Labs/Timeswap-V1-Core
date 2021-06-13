// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

interface InterfaceERC165 {
    // VIEW

    function supportsInterface(bytes4 interfaceID) external pure returns (bool);
}
