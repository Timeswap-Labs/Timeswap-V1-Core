import * as Mint from "./MintTestCases"

export function lend(): Lend {
    const mintTests = Mint.mintTestCases();
    const lendTests = lendTestCases();

    const testCases = mintTests.flatMap((mintParams) => {
        return lendTests.map((lendParams) => {
            return { mintParams, lendParams };
        });
    });

    const success = testCases.filter(lendSuccessCheck);
    const failure = testCases.filter(lendFailureCheck).map(lendMessage);

    return { Success: success, Failure: failure };

}

export function lendTestCases(): LendParams[] {
    const testCases = [
        { assetIn: 100n, interestDecrease: 0n, cdpDecrease: 2n },
        { assetIn: 100n, interestDecrease: 0n, cdpDecrease: 0n },
    ];

    return testCases;
}

export interface Lend {
    Success: { mintParams: Mint.MintParams; lendParams: LendParams }[];
    Failure: {
        mintParams: Mint.MintParams;
        lendParams: LendParams;
        errorMessage: string;
    }[];
}

export interface LendParams {
    assetIn: bigint;
    interestDecrease: bigint;
    cdpDecrease: bigint;
}

function lendSuccessCheck(params: {
    mintParams: Mint.MintParams;
    lendParams: LendParams;
}): boolean {
    if (!Mint.mintSuccessCheck(params.mintParams)) {
        return false;
    } else if (
        !(
            params.lendParams.interestDecrease > 0n ||
            params.lendParams.cdpDecrease > 0n
        )
    ) {
        return false;
    } else {
        return true;
    }
}

function lendFailureCheck(value: {
    mintParams: Mint.MintParams;
    lendParams: LendParams;
}): boolean {
    return !lendSuccessCheck(value);
}

function lendMessage({
    mintParams,
    lendParams,
}: {
    mintParams: Mint.MintParams;
    lendParams: LendParams;
}): {
    mintParams: Mint.MintParams;
    lendParams: LendParams;
    errorMessage: string;
} {
    if (Mint.mintMessage(mintParams).errorMessage !== "") {
        return {
            mintParams,
            lendParams,
            errorMessage: Mint.mintMessage(mintParams).errorMessage,
        };
    } else if (
        !(lendParams.interestDecrease > 0n && lendParams.cdpDecrease > 0n)
    ) {
        return { mintParams, lendParams, errorMessage: "Invalid" };
    } else {
        return { mintParams, lendParams, errorMessage: "" };
    }
}