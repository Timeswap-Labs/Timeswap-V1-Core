import { BigNumber } from "@ethersproject/bignumber";
import { now, pseudoRandomBigUint } from "../shared/Helper";

import { shiftUp } from '../libraries/Math'
import { mulDivUp } from "../libraries/FullMath";
import MintMath from "../libraries/MintMath";
import { PROTOCOL_FEE } from "../shared/Constants";

const MaxUint112 = BigNumber.from(2).pow(112).sub(1);
const MaxUint32 = BigNumber.from(2).pow(32).sub(1);

//TODO: change this increase the test cases
const count = 30;
export interface MintParams {
    assetIn: bigint;
    collateralIn: bigint;
    interestIncrease: bigint;
    cdpIncrease: bigint;
    maturity: bigint,
    currentTimeStamp: bigint
}
export interface Mint {
    Success: MintParams[];
    Failure: MintParams[];
}

export async function mint(): Promise<MintParams[]> {
    const testCases = await mintTestCases();
    return testCases;
}

export async function mintTestCases(): Promise<MintParams[]> {
    const nt = await now();
    const testcases = Array(count)
        .fill(null)
        .map(() => {
            return {
                assetIn: pseudoRandomBigUint(MaxUint112),
                collateralIn: pseudoRandomBigUint(MaxUint112),
                interestIncrease: pseudoRandomBigUint(MaxUint112)/10n,
                cdpIncrease: pseudoRandomBigUint(MaxUint112),
                maturity: nt + 20000n,
                currentTimeStamp: nt
            }
        })
    return testcases;
}

export async function mintSuccessCheck({
    assetIn,
    interestIncrease,
    cdpIncrease,
    maturity,
    currentTimeStamp
}: MintParams): Promise<boolean> {
   

    if (!(assetIn > 0n && interestIncrease > 0n && cdpIncrease > 0n)) {
        return false;
    } else {
        return true;
    }
}

export async function mintFailureCheck(params: MintParams): Promise<boolean> {
    return !(await mintSuccessCheck(params));
}