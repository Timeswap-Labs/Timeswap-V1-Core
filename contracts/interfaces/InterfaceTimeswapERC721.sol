// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceERC721Permit} from "./InterfaceERC721Permit.sol";
import {InterfaceTimeswapPool} from "./InterfaceTimeswapPool.sol";

interface InterfaceTimeswapERC721 is InterfaceERC721Permit {
    // VIEW

    function pool() external view returns (InterfaceTimeswapPool);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function debtDecimals() external view returns (uint8);

    function collateralDecimals() external view returns (uint8);

    function collateralizedDebtOf(uint256 _tokenId)
        external
        view
        returns (uint128 _debt, uint128 _collateral);

    function totalSupply() external view returns (uint256);

    // UPDATE

    function initialize(
        string memory _string,
        uint8 _debtDecimals,
        uint8 _collateralDecimals
    ) external;

    function mint(
        address _to,
        uint256 _debt,
        uint256 _collateral
    ) external;

    function burn(
        uint256 _tokenId,
        uint256 _debt,
        uint256 _collateral
    ) external;
}
