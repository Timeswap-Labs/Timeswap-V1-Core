import { BigNumber } from "@ethersproject/bignumber";
import { now, pseudoRandomBigUint } from "../shared/Helper";

import { shiftUp } from '../libraries/Math'
import { mulDivUp } from "../libraries/FullMath";

const MaxUint112 = BigNumber.from(2).pow(112).sub(1);
const MaxUint32 = BigNumber.from(2).pow(32).sub(1);

//TODO: change this increase the test cases
const count = 1;
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

export async function mint(): Promise<Mint> {
    const testCases = await mintTestCases();
    const Success = testCases.filter(mintSuccessCheck);
    const Failure = testCases.filter(mintFailureCheck);
    return { Success, Failure };
}

export async function mintTestCases(): Promise<MintParams[]> {
    const nt = await now();
    const testcases = Array(count)
        .fill(null)
        .map(() => {
            return {
                assetIn: pseudoRandomBigUint(MaxUint112),
                collateralIn: pseudoRandomBigUint(MaxUint112),
                interestIncrease: pseudoRandomBigUint(MaxUint112),
                cdpIncrease: pseudoRandomBigUint(MaxUint112),
                maturity: BigInt((BigNumber.from(nt).add(BigNumber.from(pseudoRandomBigUint(MaxUint32)))).toString()),
                currentTimeStamp: nt
            }
        })
    return testcases;
}

export function mintSuccessCheck({
    assetIn,
    interestIncrease,
    cdpIncrease,
    maturity,
    currentTimeStamp
}: MintParams): boolean {
    // filtering for failure under MintMath.getDebt()
    let a1 = BigNumber.from(maturity).sub(BigNumber.from(currentTimeStamp));
    let a2 = a1.mul(BigNumber.from(interestIncrease));
    let a = BigNumber.from(shiftUp(BigInt(a2.toString()), 32n));
    a = a.add(BigNumber.from(assetIn));
    if (a.gt(MaxUint112)) {
        // console.log("Failing at getDebt");
        return false;
    }
    // filtering for failure under MintMath.getCollateral()
    let b = a2;
    b = b.add(BigNumber.from(assetIn << 33n));
    b = BigNumber.from(mulDivUp(BigInt(b.toString()),cdpIncrease,assetIn << 32n));
    if (b.gt(MaxUint112)) {
        // console.log("Failing at getCollateral");
        return false
    };
    if (!(assetIn > 0n && interestIncrease > 0n && cdpIncrease > 0n)) { 
        return false;
    } else {
        return true;
    }
}

function mintFailureCheck(params: MintParams): boolean {
    return !mintSuccessCheck(params);
}