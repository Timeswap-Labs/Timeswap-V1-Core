// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceERC20} from "./InterfaceERC20.sol";
import {InterfaceERC20Permit} from "./InterfaceERC20Permit.sol";
import {InterfaceTimeswapERC20} from "./InterfaceTimeswapERC20.sol";
import {InterfaceTimeswapERC721} from "./InterfaceTimeswapERC721.sol";
import {InterfaceTimeswapFactory} from "./InterfaceTimeswapFactory.sol";

interface InterfaceTimeswapPool is InterfaceERC20Permit {
    // EVENT

    event Mint(
        address indexed _sender,
        address indexed _to,
        uint256 _tokenId,
        uint256 _bondIncreaseAndCollateralPaid,
        uint256 _insuranceIncreaseAndDebtRequired,
        uint256 _bondReceivedAndCollateralLocked,
        uint256 _insuranceReceivedAndAssetIn,
        uint256 _liquidityReceived
    );

    event Burn(
        address indexed _sender,
        address indexed _to,
        uint256 _tokenId,
        uint256 _liquidityIn,
        uint256 _collateralLocked,
        uint256 _debtRequiredAndAssetReceived,
        uint256 _bondReceived,
        uint256 _insuranceReceived
    );

    event Lend(
        address indexed _sender,
        address indexed _to,
        uint256 _assetIn,
        uint256 _bondReceived,
        uint256 _insuranceReceived
    );

    event Borrow(
        address indexed _sender,
        address indexed _to,
        uint256 _tokenId,
        uint256 _assetReceived,
        uint256 _collateralRequired,
        uint256 _debtRequired
    );

    event Withdraw(
        address indexed _sender,
        address indexed _to,
        uint256 _bondIn,
        uint256 _insuranceIn,
        uint256 _assetReceived,
        uint256 _collateralReceived
    );
    
    event Pay(
        address indexed _sender,
        address indexed _to,
        uint256 _tokenId,
        uint256 _assetIn,
        uint256 _collateralReceived
    );

    event Sync(
        uint256 _assetBalance,
        uint256 _collateralBalance,
        uint256 _rateBalance,
        uint256 _bondBalance,
        uint256 _insuranceBalancee
    );

    // VIEW

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function maturity() external view returns (uint256);

    function factory() external view returns (InterfaceTimeswapFactory);

    function asset() external view returns (InterfaceERC20);

    function collateral() external view returns (InterfaceERC20);

    function bond() external view returns (InterfaceTimeswapERC20);

    function insurance() external view returns (InterfaceTimeswapERC20);

    function collateralizedDebt() external view returns (InterfaceTimeswapERC721);

    function assetReserve() external view returns (uint128);

    function rateReserve() external view returns (uint128);

    function collateralReserve() external view returns (uint128);

    function transactionFee() external view returns (uint128);

    function protocolFee() external view returns (uint128);

    // UPDATE

    function initialize(
        InterfaceERC20 _asset,
        InterfaceERC20 _collateral,
        uint256 _maturity,
        InterfaceTimeswapERC20 _bond,
        InterfaceTimeswapERC20 _insurance,
        InterfaceTimeswapERC721 _collateralizedDebt,
        uint128 _transactionFee,
        uint128 _protocolFee
    ) external;

    function mint(
        address _to,
        uint256 _bondIncreaseAndCollateralPaid,
        uint256 _insuranceIncreaseAndDebtRequired
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _bondReceivedAndCollateralLocked,
            uint256 _insuranceReceivedAndAssetIn,
            uint256 _liquidityReceived
        );

    function burn(
        address _to
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequiredAndAssetReceived,
            uint256 _bondReceived,
            uint256 _insuranceReceived
        );

    function lend(
        address _to,
        uint256 _bondDecrease,
        uint256 _rateDecrease
    )
        external
        returns (
            uint256 _bondReceived,
            uint256 _insuranceReceived
        );

    function borrow(
        address _to,
        uint256 _assetReceived,
        uint256 _bondIncrease,
        uint256 _rateIncrease
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequired
        );

    function withdraw(
        address _to,
        uint256 _bondIn,
        uint256 _insuranceIn
    )
        external
        returns (
            uint256 _assetReceived,
            uint256 _collateralReceived
        );

    function pay(
        uint256 _tokenId
    )
        external
        returns (
            uint256 _collateralReceived
        );

    function skim(address _to) external;
}
