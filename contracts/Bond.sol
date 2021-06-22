// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {TimeswapERC20} from "./TimeswapERC20.sol";

/// @title Timeswap Bond
/// @author Ricsson W. Ngo
/// @dev This contract follows the ERC20 standard
/// @dev Gives proportional asset ERC20 to the owner when burnt after maturity
contract Bond is TimeswapERC20 {
    /* ===== MODEL ===== */

    string public constant override name = "Timeswap Bond";
    string public override symbol;

    /* ===== INIT ===== */

    /// @dev Initializes the bond ERC20 contract
    /// @param _symbol The additional symbol ticker added in the format of -{asset symbol}-{collateral symbol}-{maturity time in unix timestamp}
    /// @param _decimals The decimals set for the bond ERC20 contract
    function initialize(string memory _symbol, uint8 _decimals)
        external
        override
    {
        // The symbol ticker of the bond ERC20 token contract follows this format
        // BD-{asset symbol}-{collateral symbol}-{maturity time in unix timestamp}
        // Example for pair DAI as the asset and WETH as the collateral at maturity time 1750000000
        // BD-DAI-WETH-1750000000
        // Example for another pair DAI as the asset but the collateral ERC20 has no symbol ticker with the same maturity as above
        // BD-DAI--1750000000
        symbol = string(abi.encodePacked("BD", _symbol));
        // The decimal place of the bond ERC20 is the same as the decimal place of the collateral ERC20
        _initialize(name, _decimals);
    }
}
