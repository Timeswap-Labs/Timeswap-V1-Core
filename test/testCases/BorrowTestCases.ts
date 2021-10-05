import { BigNumber } from "@ethersproject/bignumber";
import { now, pseudoRandomBigUint } from "../shared/Helper";

import { shiftUp } from '../libraries/Math'
import { mulDivUp } from "../libraries/FullMath";

const MaxUint112 = BigNumber.from(2).pow(112).sub(1);
const MaxUint32 = BigNumber.from(2).pow(32).sub(1);

import * as Mint from "./MintTestCases"

export interface Borrow {
    assetIn: bigint;
    collateralIn: bigint;
    interestIncrease: bigint;
    cdpIncrease: bigint;
    maturity: bigint,
    currentTimeStamp: bigint;
    lendAssetIn: bigint;
    lendInterestDecrease: bigint;
    lendCdpDecrease: bigint;
    borrowAssetOut: bigint;
    borrowCollateralIn: bigint;
    borrowInterestIncrease: bigint;
    borrowCdpIncrease: bigint;
}
export interface BorrowParams {
    assetOut: bigint;
    collateralIn: bigint;
    interestIncrease: bigint;
    cdpIncrease: bigint;
}

export async function borrow(): Promise<Borrow[]> {
    const mintTests = await Mint.mint(); // an object with two keys Success and Failure
    const mintSuccessTestCases = mintTests.Success; // this is an array of SuccessCases
    const borrowCases: Borrow[] = [];
    for (let i = 0; i < mintSuccessTestCases.length; i++) {
        borrowCases.push({
            assetIn: mintSuccessTestCases[i].assetIn,
            collateralIn: mintSuccessTestCases[i].collateralIn,
            interestIncrease: mintSuccessTestCases[i].interestIncrease,
            cdpIncrease: mintSuccessTestCases[i].cdpIncrease,
            maturity: mintSuccessTestCases[i].maturity,
            currentTimeStamp: mintSuccessTestCases[i].currentTimeStamp,
            lendAssetIn: (mintSuccessTestCases[i].assetIn) / 10n,
            lendInterestDecrease: (mintSuccessTestCases[i].assetIn) / 100n,
            lendCdpDecrease: 2n,
            borrowAssetOut: 100n,
            borrowCollateralIn: 100n,
            borrowInterestIncrease: 100n,
            borrowCdpIncrease: 100n,
        }
        )
    }
    return borrowCases;
}


