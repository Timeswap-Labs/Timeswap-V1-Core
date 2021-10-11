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
    const borrowCases: Borrow[] = [];
    for (let i = 0; i < mintTests.length; i++) {
        borrowCases.push({
            assetIn: mintTests[i].assetIn,
            collateralIn: mintTests[i].collateralIn,
            interestIncrease: mintTests[i].interestIncrease,
            cdpIncrease: mintTests[i].cdpIncrease,
            maturity: mintTests[i].maturity,
            currentTimeStamp: mintTests[i].currentTimeStamp,
            borrowAssetOut: (BigInt(MaxUint112.toString()) - mintTests[i].assetIn) / 2n,
            borrowCollateralIn: pseudoRandomBigUint(MaxUint112) / 2n,
            borrowInterestIncrease: (BigInt(MaxUint112.toString()) - mintTests[i].interestIncrease) / 2n,
            borrowCdpIncrease: (BigInt(MaxUint112.toString()) - mintTests[i].cdpIncrease) / 2n,
        }
        )
    }
    const temp = [
        {
            assetIn: 1773228845427244530900000000000000n,
            collateralIn: 1606248230034087416600000000000000n,
            interestIncrease: 4568395488743510846900000000000000n,
            cdpIncrease: 873277268664785053010000000000000n,
            maturity: 1780393693n,
            currentTimeStamp: 1633591127n,
            borrowAssetOut: 1709534006553791548815248164610047n,
            borrowCollateralIn: 1436569571540629858200000000000000n,
            borrowInterestIncrease: 311950684895658390815248164610047n,
            borrowCdpIncrease: 2159509794935021287760248164610047n
        },
    ]
    return borrowCases;
}


