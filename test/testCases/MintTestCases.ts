import { BigNumber } from "@ethersproject/bignumber";
import { pseudoRandomBigUint } from "../shared/Helper";

const MaxUint112 = BigNumber.from(2).pow(112).sub(1);
export interface MintParams {
    assetIn: bigint;
    collateralIn: bigint;
    interestIncrease: bigint;
    cdpIncrease: bigint;
}
export interface Mint {
    Success: MintParams[];
    Failure: {
        params: MintParams;
        errorMessage: string;
    }[];
}

export function mint(): Mint {
    const testCases = mintTestCases();
    const Success = testCases.filter(mintSuccessCheck);
    const Failure = testCases.filter(mintFailureCheck).map(mintMessage);
    return { Success, Failure };
}

export function mintTestCases(): MintParams[] {
    const testcases = Array(10)
        .fill(null)
        .map(() => {
            return {
                assetIn: pseudoRandomBigUint(MaxUint112),
                collateralIn: pseudoRandomBigUint(MaxUint112),
                interestIncrease: pseudoRandomBigUint(MaxUint112),
                cdpIncrease: pseudoRandomBigUint(MaxUint112),
            }
        })
    return testcases;
}

export function mintSuccessCheck({
    interestIncrease,
    cdpIncrease,
}: MintParams): boolean {
    if (!(interestIncrease > 0n && cdpIncrease > 0n)) { 
        // if both the interestIncrease and the cdpIncrease are below zero
        return false;
    } else {
        return true;
    }
}

function mintFailureCheck(params: MintParams): boolean {
    return !mintSuccessCheck(params);
}

export function mintMessage(params: MintParams): {
    params: MintParams;
    errorMessage: string;
} {
    if (!(params.interestIncrease > 0n && params.cdpIncrease > 0n)) {
        return { params, errorMessage: "Invalid" };
    } else {
        return { params, errorMessage: "" };
    }
}