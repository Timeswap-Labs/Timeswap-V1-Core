// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceTimeswapERC721} from "./interfaces/InterfaceTimeswapERC721.sol";
import {InterfaceTimeswapPool} from "./interfaces/InterfaceTimeswapPool.sol";
import {ERC721Permit} from "./ERC721Permit.sol";

/// @title Timeswap ERC721
/// @author Ricsson W. Ngo
/// @dev This contract follows the ERC721 standard
/// @dev Only the Timeswap factory can call these functions
abstract contract TimeswapERC721 is ERC721Permit, InterfaceTimeswapERC721 {
    /* ===== MODEL ===== */

    // Debt and collateral is capped at uint128
    uint256 private constant MAXIMUM_BALANCE = type(uint128).max;

    InterfaceTimeswapPool public override pool;

    uint8 public override collateralDecimals;
    uint8 public override debtDecimals;
    
    struct CollateralizedDebt {
        uint128 collateral;
        uint128 debt;
    }

    mapping(uint256 => CollateralizedDebt) public override collateralizedDebtOf;

    /* ===== VIEW ===== */

    /// @dev Minted tokens starts at id 1, therefore the tokenId represents number of tokens minted
    function totalSupply() external override view returns (uint256) {
        return tokenId;
    }

    /* ===== UPDATE ===== */

    function mint(address _to, uint256 _collateral, uint256 _debt) external override {
        require(InterfaceTimeswapPool(msg.sender) == pool, "TimeswapERC721 :: mint : Forbidden");
        require(_collateral <= MAXIMUM_BALANCE && _debt <= MAXIMUM_BALANCE, "TimeswapERC721 :: mint : Overflow");

        // Minted tokens starts at id 1
        tokenId++;
        uint256 _tokenId = tokenId; // gas saving
        collateralizedDebtOf[_tokenId] = CollateralizedDebt(uint128(_collateral), uint128(_debt));
        _safeMint(_to, _tokenId);
    }

    function burn(uint256 _tokenId, uint256 _collateral, uint256 _debt) external override {
        require(InterfaceTimeswapPool(msg.sender) == pool, "TimeswapERC721 :: mint : Forbidden");

        collateralizedDebtOf[_tokenId].collateral -= uint128(_collateral);
        collateralizedDebtOf[_tokenId].debt -= uint128(_debt);
    }

    /* ===== HELPER ===== */

    function _initialize(string memory _name, uint8 _collateralDecimals, uint8 _assetDecimals) internal {
        require(pool == InterfaceTimeswapPool(address(type(uint160).min)), "TimeswapERC721 :: _initialize : Forbidden");
        pool = InterfaceTimeswapPool(msg.sender);
        collateralDecimals = _collateralDecimals;
        debtDecimals = _assetDecimals;

        _setDomainSeparator(_name);
    }
}
