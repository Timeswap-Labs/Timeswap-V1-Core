import { TotalClaims } from "../shared/PairInterface";
import * as Mint from "./MintTestCases"

export function withdraw(): Withdraw {
    const testCases = withdrawTestCases();
    // const lendTests = lendTestCases()

    // const testCases = mintTests.flatMap((mintParams) => {
    //   return lendTests.map((lendParams) => {
    //     return { mintParams, lendParams }
    //   })
    // })

    const success = testCases.filter(withdrawSuccessCheck);
    const failure = testCases.filter(withdrawFailureCheck).map(withdrawMessage);

    return { Success: success, Failure: failure };

}


function withdrawTestCases(): WithdrawParams[] {
    const testCases = [
        // { claimsIn: { bond: 100n, insurance: 1n } },
        { claimsIn: { bond: 100n, insurance: 37n } },
        // { claimsIn: 1000n },
    ];

    return testCases;
}


export interface Withdraw {
    Success: WithdrawParams[];
    Failure: {
        params: WithdrawParams;
        errorMessage: string;
    }[];
}



export interface WithdrawParams {
    claimsIn: TotalClaims;
}

function withdrawSuccessCheck(withdrawParams: WithdrawParams): boolean {
    if (
        withdrawParams.claimsIn.bond > 0n ||
        withdrawParams.claimsIn.insurance > 0n
    ) {
        return true;
    } else {
        return false;
    }
}

function withdrawFailureCheck(withdrawParams: WithdrawParams): boolean {
    return !withdrawSuccessCheck(withdrawParams);
}

function withdrawMessage(params: WithdrawParams): {
    params: WithdrawParams;
    errorMessage: string;
} {
    if (!(params.claimsIn.bond > 0n || params.claimsIn.insurance > 0n)) {
        return { params, errorMessage: "Invalid" };
    } else {
        return { params, errorMessage: "" };
    }
}