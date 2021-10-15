import { Lend } from ".";
import { now } from "../shared/Helper";
import { TotalClaims } from "../shared/PairInterface";


export async function withdraw(): Promise<Lend[]> {
    const nt = await now();
    const TestCases = [
        {
            assetIn: 2819265634205493856300000000000000n,
            collateralIn: 757001891963096413960000000000000n,
            interestIncrease: 956408028562009221860000000000000n,
            cdpIncrease: 2231034977219894488200000000000000n,
            maturity: 3908191630n,
            currentTimeStamp: nt,
            lendAssetIn: 1186515612164666886115248164610047n,
            lendInterestDecrease: 95640802856200922186000000000000n,
            lendCdpDecrease: 4617242699215623745800000000000000n
        },
        {
            assetIn: 899950981977207325560000000000000n,
            collateralIn: 1813099977777597700300000000000000n,
            interestIncrease: 400972741571188468090000000000000n,
            cdpIncrease: 419698419987769879290000000000000n,
            maturity: 4908291630n,
            currentTimeStamp: nt,
            lendAssetIn: 2146172938278810151485248164610047n,
            lendInterestDecrease: 40097274157118846809000000000000n,
            lendCdpDecrease: 1804575708346088774500000000000000n
        },
        {
            assetIn: 3305787749378396632300000000000000n,
            collateralIn: 2363681250405157143500000000000000n,
            interestIncrease: 181458407966973589250000000000000n,
            cdpIncrease: 1013731954400208620400000000000000n,
            maturity: 3908391630n,
            currentTimeStamp: nt,
            lendAssetIn: 943254554578215498115248164610047n,
            lendInterestDecrease: 18145840796697358925000000000000n,
            lendCdpDecrease: 4695622243261800967700000000000000n
        },
        {
            assetIn: 880650601196729777420000000000000n,
            collateralIn: 3634735350586123996600000000000000n,
            interestIncrease: 2945675251339132266600000000000000n,
            cdpIncrease: 977409412442049051180000000000000n,
            maturity: 3908491630n,
            currentTimeStamp: nt,
            lendAssetIn: 2155823128669048925555248164610047n,
            lendInterestDecrease: 294567525133913226660000000000000n,
            lendCdpDecrease: 123305783930698249520000000000000n
        },
        {
            assetIn: 1615464566685997380400000000000000n,
            collateralIn: 1380563320576256061800000000000000n,
            interestIncrease: 4817722756089940111900000000000000n,
            cdpIncrease: 1337067412041282878600000000000000n,
            maturity: 3908591630n,
            currentTimeStamp: nt,
            lendAssetIn: 1788416145924415124065248164610047n,
            lendInterestDecrease: 481772275608994011190000000000000n,
            lendCdpDecrease: 1372128798913264746500000000000000n
        }
    ]
    return TestCases;
}

export interface LendAndBorrow {
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
export interface WithdrawParams {
    claimsIn: TotalClaims;
}

export async function lossWithdraw(): Promise<LendAndBorrow[]> {
    const nt = await now();
    const TestCases = [
        {
            assetIn: 1000n,
            collateralIn: 5n,
            interestIncrease: 2n,
            cdpIncrease: 2231034977219894488200000000000000n,
            maturity: 3908191630n,
            currentTimeStamp: nt,
            lendAssetIn: 200000n,
            lendInterestDecrease: 1n,
            lendCdpDecrease: 1000n,
            borrowAssetOut: 20500n,
            borrowCollateralIn: 1000n,
            borrowInterestIncrease: 4000n,
            borrowCdpIncrease: 5000n
        }
    ]
    return TestCases;
}
