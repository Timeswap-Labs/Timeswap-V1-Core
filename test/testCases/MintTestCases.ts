import { BigNumber } from "@ethersproject/bignumber";
import { now, pseudoRandomBigUint } from "../shared/Helper";

import { shiftUp } from '../libraries/Math'

const MaxUint112 = BigNumber.from(2).pow(112).sub(1);


export interface MintParams {
    assetIn: bigint;
    collateralIn: bigint;
    interestIncrease: bigint;
    cdpIncrease: bigint;
    maturity: bigint,
}
export interface Mint {
    Success: MintParams[];
    Failure: {
        params: MintParams;
        errorMessage: string;
    }[];
}

export async function mint(): Promise<Mint> {
    const testCases = await mintTestCases();
    const Success = testCases.filter(mintSuccessCheck);
    const Failure = testCases.filter(mintFailureCheck).map(mintMessage);
    return { Success, Failure };
}

export async function mintTestCases(): Promise<MintParams[]> {
    const nt = await now();
    const testcases = Array(2)
        .fill(null)
        .map(() => {
            return {
                assetIn: pseudoRandomBigUint(MaxUint112),
                collateralIn: pseudoRandomBigUint(MaxUint112),
                interestIncrease: pseudoRandomBigUint(MaxUint112),
                cdpIncrease: pseudoRandomBigUint(MaxUint112),
                maturity: BigInt((BigNumber.from(nt).add(BigNumber.from(pseudoRandomBigUint(MaxUint112)))).toString())
            }
        })
    return testcases;
}

// TODO: EVEN XINCREASE HAS TO BE GREATER THAN ZERO
export async function mintSuccessCheck({
    assetIn,
    interestIncrease,
    cdpIncrease,
    maturity
}: MintParams): Promise<boolean> {
    // {x+(yd)>>32}<=maxUint112 // TODO: DIPESH TO PUT THIS AS A RESTRICTION
    const nt = await now();
    let a = BigNumber.from(maturity).sub(BigNumber.from(nt));
    a = a.mul(BigNumber.from(interestIncrease));
    a = BigNumber.from(shiftUp(BigInt(a.toString()), 32n));
    a = a.add(BigNumber.from(assetIn));
    if (a>MaxUint112) return false;
    if (!(assetIn > 0n && interestIncrease > 0n && cdpIncrease > 0n)) { 
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
    if (!(params.interestIncrease > 0n && params.cdpIncrease > 0n && params.assetIn > 0n)) {
        return { params, errorMessage: "One of the params is Zero" };
    } else {
        return { params, errorMessage: "Math Error" };
    }
}