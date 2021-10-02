import { BigNumber } from "@ethersproject/bignumber";
import { now, pseudoRandomBigUint } from "../shared/Helper";

import { shiftUp } from '../libraries/Math'
import { mulDivUp } from "../libraries/FullMath";

const MaxUint112 = BigNumber.from(2).pow(112).sub(1);
const MaxUint32 = BigNumber.from(2).pow(32).sub(1);

import * as Mint from "./MintTestCases"
export interface Lend {
    Success: { mintParams: Mint.MintParams; lendParams: LendParams }[];
    Failure: {
        mintParams: Mint.MintParams;
        lendParams: LendParams;
    }[];
}
export interface LendParams {
    assetIn: bigint;
    interestDecrease: bigint;
    cdpDecrease: bigint;
}

export async function lend(): Promise<Lend> {
    const mintTests = await Mint.mintTestCases();
    // const mintTests = await Mint.mint();
    // const mintSuccessTestCases = mintTests.Success;
    // const mintFailureTestCases = mintTests.Failure;
    const lendTests = lendTestCases();

    // filter lendTests based on its own success and failure criteria
    // then flatmap

    const testCases = mintTests.flatMap((mintParams) => {
        return lendTests.map((lendParams) => {
            return { mintParams, lendParams };
        });
    });

    const success = testCases.filter(lendSuccessCheck);
    const failure = testCases.filter(lendFailureCheck);

    return { Success: success, Failure: failure };

}

export function lendTestCases(): LendParams[] {
    const testCases = [
        //TODO: to randomize the following test cases
        { assetIn: 100n, interestDecrease: 0n, cdpDecrease: 2n },
        { assetIn: 100n, interestDecrease: 0n, cdpDecrease: 0n },
    ];
    return testCases;
}


function lendSuccessCheck(params: {
    mintParams: Mint.MintParams;
    lendParams: LendParams;
}): boolean {
    if (!Mint.mintSuccessCheck(params.mintParams)) {
        return false;
    } else if (
        !(
            params.lendParams.interestDecrease > 0n ||
            params.lendParams.cdpDecrease > 0n
        )
    ) {
        return false;
    } else {
        return true;
    }
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