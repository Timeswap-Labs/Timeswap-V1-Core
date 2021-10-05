import { BigNumber } from "@ethersproject/bignumber";
import { now, pseudoRandomBigUint } from "../shared/Helper";

import { shiftUp } from '../libraries/Math'
import { mulDivUp } from "../libraries/FullMath";

const MaxUint64 = BigNumber.from(2).pow(64).sub(1);
const MaxUint32 = BigNumber.from(2).pow(32).sub(1);
const MaxUint16= BigNumber.from(2).pow(16).sub(1);

import * as Mint from "./MintTestCases"
import Constants from "../shared/Constants";
export interface Lend {
    assetIn: bigint;
    collateralIn: bigint;
    interestIncrease: bigint;
    cdpIncrease: bigint;
    maturity: bigint,
    currentTimeStamp: bigint;
    lendAssetIn:bigint;
    lendInterestDecrease:bigint;
    lendCdpDecrease:bigint;
}

export interface LendParams {
    assetIn: bigint;
    interestDecrease: bigint;
    cdpDecrease: bigint;
}

export async function lend(): Promise<Lend[]> {
    const mintTests = await Mint.mint(); // an object with two keys Success and Failure
    const mintSuccessTestCases = mintTests.Success; // this is an array of SuccessCases
    const lendCases: Lend[] = [];
    for (let i=0; i<mintSuccessTestCases.length; i++) {
        lendCases.push({
            assetIn: mintSuccessTestCases[i].assetIn,
            collateralIn: mintSuccessTestCases[i].collateralIn,
            interestIncrease: mintSuccessTestCases[i].interestIncrease,
            cdpIncrease: mintSuccessTestCases[i].cdpIncrease,
            maturity: mintSuccessTestCases[i].maturity,
            currentTimeStamp: mintSuccessTestCases[i].currentTimeStamp,
            lendAssetIn:  (mintSuccessTestCases[i].assetIn)/10n,
            lendInterestDecrease: (mintSuccessTestCases[i].assetIn)/100n,
            lendCdpDecrease: 2n,
        }
            )
    }
    return lendCases;
}