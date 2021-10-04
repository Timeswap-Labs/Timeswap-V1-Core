import { BigNumber } from "@ethersproject/bignumber";
import { now, pseudoRandomBigUint } from "../shared/Helper";

import { shiftUp } from '../libraries/Math'
import { mulDivUp } from "../libraries/FullMath";

const MaxUint112 = BigNumber.from(2).pow(112).sub(1);
const MaxUint32 = BigNumber.from(2).pow(32).sub(1);

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
            lendAssetIn: pseudoRandomBigUint(MaxUint112),
            lendInterestDecrease: pseudoRandomBigUint(MaxUint112),
            lendCdpDecrease: pseudoRandomBigUint(MaxUint112),
            assetIn: mintSuccessTestCases[i].assetIn,
            collateralIn: mintSuccessTestCases[i].collateralIn,
            interestIncrease: mintSuccessTestCases[i].interestIncrease,
            cdpIncrease: mintSuccessTestCases[i].cdpIncrease,
            maturity: mintSuccessTestCases[i].maturity,
            currentTimeStamp: mintSuccessTestCases[i].currentTimeStamp}
            )
    }
    return lendCases;
}

    // console.log("mintSuccessTestCases.length", mintSuccessTestCases.length);
    // const lendTests = lendTestCases();

    // const testCases = mintSuccessTestCases.flatMap((mintParams) => {
    //     return lendTests.map((lendParams) => {
    //         return { mintParams, lendParams };
    //     });
    // });
    // console.log(testCases);

    // const success = testCases.filter(lendSuccessCheck);
    // const failure = testCases.filter(lendFailureCheck);

    // return { Success: success, Failure: failure };



export function lendTestCases(): LendParams[] {
    const testCases = [
        { assetIn: 100n, interestDecrease: 0n, cdpDecrease: 2n },
        { assetIn: 100n, interestDecrease: 0n, cdpDecrease: 0n },
    ];
    return testCases;
}


function lendSuccessCheck(params: {
    mintParams: Mint.MintParams;
    lendParams: LendParams;
}): boolean {
    if(
        !(
            params.lendParams.interestDecrease > 0n ||
            params.lendParams.cdpDecrease > 0n
        )
    ) return false;
    return true;
    }


function lendFailureCheck(value: {
    mintParams: Mint.MintParams;
    lendParams: LendParams;
}): boolean {
    return !lendSuccessCheck(value);
}

// function lendMessage({
//     mintParams,
//     lendParams,
// }: {
//     mintParams: Mint.MintParams;
//     lendParams: LendParams;
// }): {
//     mintParams: Mint.MintParams;
//     lendParams: LendParams;
//     errorMessage: string;
// } {
//     if (Mint.mintMessage(mintParams).errorMessage !== "") {
//         return {
//             mintParams,
//             lendParams,
//             errorMessage: Mint.mintMessage(mintParams).errorMessage,
//         };
//     } else if (
//         !(lendParams.interestDecrease > 0n && lendParams.cdpDecrease > 0n)
//     ) {
//         return { mintParams, lendParams, errorMessage: "Invalid" };
//     } else {
//         return { mintParams, lendParams, errorMessage: "" };
//     }
// }