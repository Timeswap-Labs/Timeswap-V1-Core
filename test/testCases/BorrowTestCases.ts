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
            borrowAssetOut: (BigInt(MaxUint112.toString()) - mintSuccessTestCases[i].assetIn) / 2n,
            borrowCollateralIn: pseudoRandomBigUint(MaxUint112) / 2n,
            borrowInterestIncrease: (BigInt(MaxUint112.toString()) - mintSuccessTestCases[i].interestIncrease) / 2n,
            borrowCdpIncrease: (BigInt(MaxUint112.toString()) - mintSuccessTestCases[i].cdpIncrease) / 2n,
        }
        )
    }
    const temp = [
        {
            assetIn: 1915747864637765215300000000000000n,
            collateralIn: 1957892161864474110100000000000000n,
            interestIncrease: 170163656054420394580000000000000n,
            cdpIncrease: 1696137072483547986100000000000000n,
            maturity: 3529305580n,
            currentTimeStamp: 1633590166n,
            borrowAssetOut: 1638274496948531206615248164610047n,
            borrowCollateralIn: 1413753426319351357450000000000000n,
            borrowInterestIncrease: 2511066601240203616975248164610047n,
            borrowCdpIncrease: 1748079893025639821215248164610047n
        } // reverted without a reason
    
    ]
    return temp;
}


