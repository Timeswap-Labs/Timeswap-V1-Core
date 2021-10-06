import * as Mint from "./MintTestCases"
import * as Borrow from "./BorrowTestCases";
import * as Lend from "./LendTestCases";

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

// TODO: to assign a type to the return value
export async function pay(): Promise<any> {
    const mintTests = await Mint.mintTestCases(); // getting the mint Test Cases
    const lendTests = await Lend.lend(); // getting the lend Test Cases
    const borrowTests = await Borrow.borrow(); // getting the borrow Test Cases
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