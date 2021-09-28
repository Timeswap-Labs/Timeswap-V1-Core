import * as Mint from "./MintTestCases"

export function borrow(): Borrow {
    const mintTests = Mint.mintTestCases();
    const borrowTests = borrowTestCases();

    const testCases = mintTests.flatMap((mintParams) => {
        return borrowTests.map((borrowParams) => {
            return { mintParams, borrowParams };
        });
    });

    const success = testCases.filter(borrowSuccessCheck);
    const failure = testCases.filter(borrowFailureCheck).map(borrowMessage);

    return { Success: success, Failure: failure };
    // generate random inputs based on some rule
    // check which inputs will pass
    // check which inputs will fail with which error
    // pass inputs array and fail inputs array
}

export function borrowTestCases(): BorrowParams[] {
    const testCases = [
        {
            assetOut: 2010n,
            collateralIn: 5000n,
            interestIncrease: 100n,
            cdpIncrease: 2n,
        },
        {
            assetOut: 200n,
            collateralIn: 72n,
            interestIncrease: 0n,
            cdpIncrease: 0n,
        },
    ];

    return testCases;
}

export interface Borrow {
    Success: { mintParams: Mint.MintParams; borrowParams: BorrowParams }[];
    Failure: {
        mintParams: Mint.MintParams;
        borrowParams: BorrowParams;
        errorMessage: string;
    }[];
}

export interface BorrowParams {
    assetOut: bigint;
    collateralIn: bigint;
    interestIncrease: bigint;
    cdpIncrease: bigint;
}

function borrowSuccessCheck(params: {
    mintParams: Mint.MintParams;
    borrowParams: BorrowParams;
}): boolean {
    if (!Mint.mintSuccessCheck(params.mintParams)) {
        return false;
    } else if (
        !(
            params.borrowParams.interestIncrease > 0n ||
            params.borrowParams.cdpIncrease > 0n
        )
    ) {
        return false;
    } else {
        return true;
    }
}

function borrowFailureCheck(value: {
    mintParams: Mint.MintParams;
    borrowParams: BorrowParams;
}): boolean {
    return !borrowSuccessCheck(value);
}

function borrowMessage({
    mintParams,
    borrowParams,
}: {
    mintParams: Mint.MintParams;
    borrowParams: BorrowParams;
}): {
    mintParams: Mint.MintParams;
    borrowParams: BorrowParams;
    errorMessage: string;
} {
    if (Mint.mintMessage(mintParams).errorMessage !== "") {
        return {
            mintParams,
            borrowParams,
            errorMessage: Mint.mintMessage(mintParams).errorMessage,
        };
    } else if (
        !(borrowParams.interestIncrease > 0n || borrowParams.cdpIncrease > 0n)
    ) {
        return { mintParams, borrowParams, errorMessage: "Invalid" };
    } else {
        return { mintParams, borrowParams, errorMessage: "" };
    }
}