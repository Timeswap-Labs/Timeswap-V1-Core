const testCases = {
  mintInitial: [
    {
      assetIn: 100n,
      bondIncrease: 20n,
      insuranceIncrease: 1100n,
      collateralIn: 240n,

      bondReceived: 220n,
      insuranceReceived: 100n,

      liquidityBurn: 1000n,
      liquidityReceived: 99n,
      liquidityFeeTo: 1n,

      bondTotalSupply: 240n,
      insuranceTotalSupply: 1200n,
      liquidityTotalSupply: 1100n,
    },
    {
      assetIn: 1000n,
      bondIncrease: 20n,
      insuranceIncrease: 1400n,
      collateralIn: 2400n,

      bondReceived: 28n,
      insuranceReceived: 1000n,

      liquidityBurn: 1000n,
      liquidityReceived: 398n,
      liquidityFeeTo: 2n,

      bondTotalSupply: 48n,
      insuranceTotalSupply: 2400n,
      liquidityTotalSupply: 1400n,
    },
    {
      assetIn: 1000000000000000000n,
      bondIncrease: 20000000000000000n,
      insuranceIncrease: 1400000000000000000n,
      collateralIn: 2400000000000000000n,

      bondReceived: 28000000000000000n,
      insuranceReceived: 1000000000000000000n,

      liquidityBurn: 1000n,
      liquidityReceived: 1395812562313059820n,
      liquidityFeeTo: 4187437686939180n,

      bondTotalSupply: 48000000000000000n,
      insuranceTotalSupply: 2400000000000000000n,
      liquidityTotalSupply: 1400000000000000000n,
    },
  ],
  mintProportional: [
    {
      assetReserve: 100n,
      bondReserve: 20n,
      insuranceReserve: 1100n,
      collateralReserve: 240n,
      feeToBalance: 1n,

      assetIn: 10n,
      bondIncrease: 2n,
      insuranceIncrease: 110n,
      bondReceived: 22n,
      insuranceReceived: 10n,
      collateralIn: 24n,

      liquidityReceived: 109n,
      liquidityFeeTo: 1n,

      bondTotalSupplyBefore: 240n,
      insuranceTotalSupplyBefore: 1200n,
      liquidityTotalSupplyBefore: 1100n,
    },
    {
      assetReserve: 500n,
      bondReserve: 300n,
      insuranceReserve: 5600n,

      collateralReserve: 3660n, // (bondReserve * insuranceReserve).divUp(AssetReserve) + bondReserve
      //liquidity received by the initial minter 4,586

      feeToBalance: 14n, // insuranceIncrease- liquidityReceived - MINIMUM_LIQUIDITY = 5600 -4586 -1000

      assetIn: 10n,
      bondIncrease: 6n,
      insuranceIncrease: 112n,

      bondReceived: 68n,
      insuranceReceived: 10n,
      collateralIn: 74n,

      liquidityReceived: 111n,
      liquidityFeeTo: 1n,

      bondTotalSupplyBefore: 3660n,
      insuranceTotalSupplyBefore: 6100n,
      liquidityTotalSupplyBefore: 5600n,
    },
    {
      assetReserve: 8000n,
      bondReserve: 480n,
      insuranceReserve: 8960n,

      collateralReserve: 1018n, // (bondReserve * insuranceReserve).divUp(AssetReserve) + bondReserve
      //liquidity received by the initial minter 4,586

      feeToBalance: 24n, // insuranceIncrease- liquidityReceived - MINIMUM_LIQUIDITY = 5600 -4586 -1000

      assetIn: 100n,
      bondIncrease: 6n,
      insuranceIncrease: 112n,

      bondReceived: 7n,
      insuranceReceived: 100n,
      collateralIn: 13n,

      liquidityReceived: 111n,
      liquidityFeeTo: 1n,

      bondTotalSupplyBefore: 1018n,
      insuranceTotalSupplyBefore: 16960n,
      liquidityTotalSupplyBefore: 8960n,
    },
  ],
  burnBeforeMaturity: [
    {
      assetReserve: 100n,
      bondReserve: 20n,
      insuranceReserve: 1100n,
      collateralReserve: 240n,

      liquidityIn: 90n,
      bondReceived: 1n,
      insuranceReceived: 90n,

      bondTotalSupplyBefore: 240n,
      insuranceTotalSupplyBefore: 1200n,
      liquidityTotalSupplyBefore: 1100n,

      collateralIn: 1n,
      assetMax: 8n,
      assetReceived: 8n,

      collateralInExcessive: 2n,
      collateralLockedExcessive: 1n,
      assetReceivedExcessive: 8n,
    },
    {
      assetReserve: 1000n,
      bondReserve: 200n,
      insuranceReserve: 11000n,
      collateralReserve: 2400n,

      liquidityIn: 340n,
      bondReceived: 6n,
      insuranceReceived: 340n,

      bondTotalSupplyBefore: 2400n,
      insuranceTotalSupplyBefore: 12000n,
      liquidityTotalSupplyBefore: 11000n,

      collateralIn: 6n,
      assetMax: 30n,
      assetReceived: 30n,

      collateralInExcessive: 20n,
      collateralLockedExcessive: 6n,
      assetReceivedExcessive: 30n,
    },

    {
      assetReserve: 1000000000000000000n,
      bondReserve: 200000000000000000n,
      insuranceReserve: 11000000000000000000n,
      collateralReserve: 2400000000000000000n,

      liquidityIn: 340000000000000000n,
      bondReceived: 6181818181818181n,
      insuranceReceived: 340000000000000000n,

      bondTotalSupplyBefore: 2400000000000000000n,
      insuranceTotalSupplyBefore: 12000000000000000000n,
      liquidityTotalSupplyBefore: 11000000000000000000n,

      collateralIn: 1n,
      assetMax: 30909090909090909n,
      assetReceived: 5n,

      collateralInExcessive: 6181818181818182n,
      collateralLockedExcessive: 6181818181818181n,
      assetReceivedExcessive: 30909090909090909n,
    },
  ],
  burnAfterMaturity: [
    {
      assetReserve: 100n,
      bondReserve: 20n,
      insuranceReserve: 1100n,
      collateralReserve: 240n,

      liquidityIn: 90n,
      bondReceived: 1n,
      insuranceReceived: 90n,

      bondTotalSupplyBefore: 240n,
      insuranceTotalSupplyBefore: 1200n,
      liquidityTotalSupplyBefore: 1100n,
    },
    {
      assetReserve: 10000000000000000n,
      bondReserve: 2000000000000000n,
      insuranceReserve: 110000000000000000n,
      collateralReserve: 24000000000000000n,

      liquidityIn: 9000000000000000n,
      bondReceived: 163636363636363n,
      insuranceReceived: 9000000000000000n,

      bondTotalSupplyBefore: 24000000000000000n,
      insuranceTotalSupplyBefore: 120000000000000000n,
      liquidityTotalSupplyBefore: 110000000000000000n,
    },
    {
      assetReserve: 70000000000000000n,
      bondReserve: 14000000000000000n,
      insuranceReserve: 770000000000000000n,
      collateralReserve: 168000000000000000n,

      liquidityIn: 63000000000000000n,
      bondReceived: 1145454545454545n,
      insuranceReceived: 63000000000000000n,

      bondTotalSupplyBefore: 168000000000000000n,
      insuranceTotalSupplyBefore: 840000000000000000n,
      liquidityTotalSupplyBefore: 770000000000000000n,
    },
  ],
  lend: [
    {
      assetReserve: 10000000000000000n,
      bondReserve: 2000000000000000n,
      insuranceReserve: 110000000000000000n,
      collateralReserve: 24000000000000000n,
      assetIn: 2000000000000000n,
      bondDecrease: 100000000000000n,
      bondTotalSupplyBefore: 24000000000000000n,
      insuranceTotalSupplyBefore: 120000000000000000n,
    },
    {
      assetReserve: 10000000000000000000n,
      bondReserve: 2000000000000000000n,
      insuranceReserve: 110000000000000000000n,
      collateralReserve: 24000000000000000000n,
      assetIn: 2000000000000000000n,
      bondDecrease: 200000000000000000n,
      bondTotalSupplyBefore: 24000000000000000000n,
      insuranceTotalSupplyBefore: 120000000000000000000n,
    },
    {
      assetReserve: 20000000000000000000n,
      bondReserve: 4000000000000000000n,
      insuranceReserve: 220000000000000000000n,
      collateralReserve: 48000000000000000000n,
      assetIn: 4000000000000000000n,
      bondDecrease: 400000000000000000n,
      bondTotalSupplyBefore: 48000000000000000000n,
      insuranceTotalSupplyBefore: 240000000000000000000n,
    },
  ],
  borrow: [
    {
      assetReserve: 30000000000000000000000n,
      bondReserve: 6000000000000000000000n,
      insuranceReserve: 330000000000000000000000n,
      collateralReserve: 72000000000000000000000n,
      assetReceived: 4000000000000000000000n,
      bondIncrease: 90000000000000000000n,
      bondTotalSupplyBefore: 72000000000000000000000n,
      insuranceTotalSupplyBefore: 360000000000000000000000n,
    },
    {
      assetReserve: 30000000000000000000000000n,
      bondReserve: 6000000000000000000000000n,
      insuranceReserve: 330000000000000000000000000n,
      collateralReserve: 72000000000000000000000000n,
      assetReceived: 4000000000000000000000000n,
      bondIncrease: 90000000000000000000000n,
      bondTotalSupplyBefore: 72000000000000000000000000n,
      insuranceTotalSupplyBefore: 360000000000000000000000000n,
    },
  ],
  withdraw: [
    {
      assetReserve: 100n,
      bondReserve: 20n,
      insuranceReserve: 1100n,
      collateralReserve: 240n,
      bondIn: 200n,
      insuranceIn: 80n,
      assetReceived: 83n,
      collateralReceived: 16n,
      bondTotalSupplyBefore: 240n,
      insuranceTotalSupplyBefore: 1200n,
    },
    {
      assetReserve: 10000000000000000n,
      bondReserve: 2000000000000000n,
      insuranceReserve: 110000000000000000n,
      collateralReserve: 24000000000000000n,
      bondIn: 20000000000000000n,
      insuranceIn: 8000000000000000n,
      assetReceived: 8333333333333333n,
      collateralReceived: 1600000000000000n,
      bondTotalSupplyBefore: 24000000000000000n,
      insuranceTotalSupplyBefore: 120000000000000000n,
    },

    {
      assetReserve: 4000n,
      bondReserve: 800n,
      insuranceReserve: 44000n,
      collateralReserve: 9600n,
      bondIn: 4000n,
      insuranceIn: 3200n,
      assetReceived: 1666n,
      collateralReceived: 640n,
      bondTotalSupplyBefore: 9600n,
      insuranceTotalSupplyBefore: 48000n,
    },
  ],
  pay: [
    {
      assetReserve: 100n,
      bondReserve: 20n,
      insuranceReserve: 1100n,
      collateralReserve: 240n,

      tokenId: 1n,
      tokenDebt: 1100n,
      tokenCollateral: 220n,
      assetIn: 1000n,
      collateralReceived: 200n,
      assetInExecessive: 1300n,
      collateralReceivedExecessive: 220n,
      assetInFail: 1100n,
    },
    {
      assetReserve: 10000000000000000000n,
      bondReserve: 2000000000000000000n,
      insuranceReserve: 110000000000000000000n,
      collateralReserve: 24000000000000000000n,

      tokenId: 1n,
      tokenDebt: 110000000000000000000n,
      tokenCollateral: 22000000000000000000n,
      assetIn: 100000000000000000000n,
      collateralReceived: 20000000000000000000n,
      assetInExecessive: 130000000000000000000n,
      collateralReceivedExecessive: 22000000000000000000n,
      assetInFail: 110000000000000000000n,
    },

    {
      assetReserve: 3000n,
      bondReserve: 600n,
      insuranceReserve: 33000n,
      collateralReserve: 7200n,

      tokenId: 1n,
      tokenDebt: 33000n,
      tokenCollateral: 6600n,
      assetIn: 30000n,
      collateralReceived: 6000n,
      assetInExecessive: 39000n,
      collateralReceivedExecessive: 6600n,
      assetInFail: 33000n,
    },
  ],
  skim: [
    {
      assetReserve: 100n,
      bondReserve: 20n,
      insuranceReserve: 1100n,
      collateralReserve: 240n,
      assetSkim: 100n,
      collateralSkim: 200n,
    },
    {
      assetReserve: 10000000000000000000n,
      bondReserve: 2000000000000000000n,
      insuranceReserve: 110000000000000000000n,
      collateralReserve: 24000000000000000000n,
      assetSkim: 1000000000000000000n,
      collateralSkim: 20000000000000000000n,
    },

    {
      assetReserve: 4000n,
      bondReserve: 400n,
      insuranceReserve: 22000n,
      collateralReserve: 4800n,
      assetSkim: 2000n,
      collateralSkim: 4000n,
    },
  ],
}

export default {
  testCases,
}
