export function mint(): Mint {
    const testCases = mintTestCases();

    const success = testCases.filter(mintSuccessCheck);
    const failure = testCases.filter(mintFailureCheck).map(mintMessage);

    return { Success: success, Failure: failure };
}

export function mintTestCases(): MintParams[] {
    const testCases = [
        {
            assetIn: 2000n,
            collateralIn: 800n,
            interestIncrease: 20n,
            cdpIncrease: 400n,
        },
        {
            assetIn: 2000n,
            collateralIn: 2000n,
            interestIncrease: 0n,
            cdpIncrease: 0n,
        },
    ];

    return testCases;
}

export interface Mint {
    Success: MintParams[];
    Failure: {
        params: MintParams;
        errorMessage: string;
    }[];
}

export interface MintParams {
    assetIn: bigint;
    collateralIn: bigint;
    interestIncrease: bigint;
    cdpIncrease: bigint;
}

export function mintSuccessCheck({
    interestIncrease,
    cdpIncrease,
}: MintParams): boolean {
    if (!(interestIncrease > 0n && cdpIncrease > 0n)) {
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
    if (!(params.interestIncrease > 0n && params.cdpIncrease > 0n)) {
        return { params, errorMessage: "Invalid" };
    } else {
        return { params, errorMessage: "" };
    }
}