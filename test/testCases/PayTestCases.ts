// {
//     assetIn: 2278995182855247385000000000000000n,
//     collateralIn: 1830318292264265316800000000000000n,
//     interestIncrease: 863049707657643236800000000000000n,
//     cdpIncrease: 1775997773597187752700000000000000n,
//     maturity: 4743425266n,
//     currentTimeStamp: 1633598826n,
//     borrowAssetOut: 1456650837839790121765248164610047n,
//     borrowCollateralIn: 2430942800147541499100000000000000n,
//     borrowInterestIncrease: 2164623575438592195865248164610047n,
//     borrowCdpIncrease: 1708149542468819937915248164610047n
//   }

//   {
//     assetIn: 4256603941076597821300000000000000n,
//     collateralIn: 2043960857347999192700000000000000n,
//     interestIncrease: 2142084316492136513800000000000000n,
//     cdpIncrease: 618966353867802076160000000000000n,
//     maturity: 2078436421n,
//     currentTimeStamp: 1633598826n,
//     borrowAssetOut: 467846458729114903615248164610047n,
//     borrowCollateralIn: 1505846136010385633700000000000000n,
//     borrowInterestIncrease: 1525106271021345557365248164610047n,
//     borrowCdpIncrease: 2286665252333512776185248164610047n
//   }
//   {
//     assetIn: 3384965145655911321300000000000000n,
//     collateralIn: 530704822014748925640000000000000n,
//     interestIncrease: 2616739854341432634300000000000000n,
//     cdpIncrease: 732924719082945454830000000000000n,
//     maturity: 3462585154n,
//     currentTimeStamp: 1633598898n,
//     borrowAssetOut: 903665856439458153615248164610047n,
//     borrowCollateralIn: 2021334910807891593550000000000000n,
//     borrowInterestIncrease: 1287778502096697497115248164610047n,
//     borrowCdpIncrease: 2229686069725941086850248164610047n
//   }
//   {
//     assetIn: 4229140265385989170600000000000000n,
//     collateralIn: 3818732445568353904700000000000000n,
//     interestIncrease: 279673172455631449740000000000000n,
//     cdpIncrease: 2572260401702515690800000000000000n,
//     maturity: 1749127326n,
//     currentTimeStamp: 1633598898n,
//     borrowAssetOut: 481578296574419228965248164610047n,
//     borrowCollateralIn: 1457362780042835701750000000000000n,
//     borrowInterestIncrease: 2456311843039598089395248164610047n,
//     borrowCdpIncrease: 1310018228416155968865248164610047n
//   }

export interface Pay {
    // Type '{ mintTests: MintParams[]; borrowTests: BorrowParams[]; 0: any; payTests: PayParams[]; }' is missing the following properties from type '{ mintParams: MintParams; borrowParams: BorrowParams; payParams: PayParams; }': mintParams, borrowParams, payParamsts(2739)

    Success: {
        mintParams: Mint.MintParams[];
        borrowParams: Borrow.BorrowParams[];
        payParams: PayParams[]
    };
    Failure: {
        mintParams: Mint.MintParams;
        borrowParams: Borrow.BorrowParams;
        payParams: PayParams;
        errorMessage: string;
    }[];
}


export async function pay(): Promise<Borrow[]> {
    const borrowCases: Pay[] = [];
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



export async function payyyy(): Promise<any> {
    
    const payTests = borrowTests;
    // const payTestFail = payTestCaseFailure(borrowTests[0])

    const successTestCase = { mintTests, borrowTests, payTests };
    // const failureTestCase = {mintTests, borrowTests, payTestFail}

    return { Success: successTestCase };
}
// function payTestCases(borrowParams: Borrow.BorrowParams): PayParams[] {
//     // TODO: we should not be passing in the id, we should rather we pulling out the id from the contract
//     const testCases = [
//         { ids: [1n], debtIn: [borrowParams.assetOut], collateralOut: [borrowParams.collateralIn] }
//     ]
//     return testCases;
// }

// function payTestCaseFailure(borrowParams: Borrow.BorrowParams): PayParams[] {
//     const testCases = [
//         { ids: [], debtIn: [borrowParams.assetOut], collateralOut: [borrowParams.collateralIn] }
//     ];
//     return testCases;
// }
export interface PayParams {
    ids: bigint[];
    debtIn: bigint[];
    collateralOut: bigint[]
}

// function paySuccessCheck(params: {
//     mintParams: Mint.MintParams, borrowParams: Borrow.BorrowParams,
//     payParams: PayParams
// }): boolean {
//     if (
//         params.payParams.ids.length == params.payParams.debtIn.length &&
//         params.payParams.ids.length == params.payParams.collateralOut.length &&
//         params.payParams.ids.length > 0
//     ) {
//         return true;
//     } else {
//         return false;
//     }
// }

// function payFailureCheck(params: {
//     mintParams: Mint.MintParams, borrowParams: Borrow.BorrowParams,
//     payParams: PayParams
// }): boolean {
//     return !paySuccessCheck(params);
// }

// function payMessage({
//     mintParams,
//     borrowParams,
//     payParams
// }: {
//     mintParams: Mint.MintParams;
//     borrowParams: Borrow.BorrowParams;
//     payParams: PayParams;
// }): {
//     mintParams: Mint.MintParams;
//     borrowParams: Borrow.BorrowParams;
//     payParams: PayParams;
//     errorMessage: string;
// } {
//     if (paySuccessCheck({ mintParams, borrowParams, payParams })) {
//         return { mintParams, borrowParams, payParams, errorMessage: "Invalid" };
//     } else {
//         return { mintParams, borrowParams, payParams, errorMessage: "" };
//     }
// }