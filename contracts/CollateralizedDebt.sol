// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {TimeswapERC721} from './TimeswapERC721.sol';

/// @title Timeswap Collateralized Debt
/// @author Ricsson W. Ngo
/// @dev This contract follows the ERC721 standard
/// @dev Unlocks and gives collateral ERC20 back to the owner after debt is paid back
contract CollateralizedDebt is TimeswapERC721 {
    /* ===== MODEL ===== */

    string public constant override name = 'Timeswap Collateralized Debt';
    string public override symbol; // immutable

    /* ===== INIT ===== */

    /// @dev Initializes the collateralized debt ERC721 contract
    /// @param _symbol The additional symbol ticker added in the format of -{asset symbol}-{collateral symbol}-{maturity time in unix timestamp}
    /// @param _collateralDecimals The decimals set for collateral locked amount
    /// @param _assetDecimals The decimals set for the debt required amount
    function initialize(
        string memory _symbol,
        uint8 _collateralDecimals,
        uint8 _assetDecimals
    ) external override {
        // The symbol ticker of the collateralized debt ERC721 token contract follows this format
        // CD-{asset symbol}-{collateral symbol}-{maturity time in unix timestamp}
        // Example for pair DAI as the asset and WETH as the collateral at maturity time 1750000000
        // CD-DAI-WETH-1750000000
        // Example for another pair DAI as the asset but the collateral ERC20 has no symbol ticker with the same maturity as above
        // CD-DAI--1750000000
        symbol = string(abi.encodePacked('CD', _symbol));
        // The decimal place of the collateral locked is the same as the decimal place of the collateral ERC20
        // The decimal place of the debt required is the same as the decimal place of the asset ERC20
        _initialize(name, _collateralDecimals, _assetDecimals);
    }
}
