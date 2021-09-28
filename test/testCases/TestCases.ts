import { TotalClaims } from "../shared/PairInterface";

export function mint(): Mint {
  const testCases = mintTestCases();

  const success = testCases.filter(mintSuccessCheck);
  const failure = testCases.filter(mintFailureCheck).map(mintMessage);

  return { Success: success, Failure: failure };
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}

function mintTestCases(): MintParams[] {
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

function mintSuccessCheck({
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

function mintMessage(params: MintParams): {
  params: MintParams;
  errorMessage: string;
} {
  if (!(params.interestIncrease > 0n && params.cdpIncrease > 0n)) {
    return { params, errorMessage: "Invalid" };
  } else {
    return { params, errorMessage: "" };
  }
}

//burn
export function burn(): Burn {
  const testCases = burnTestCases();

  const success = testCases.filter(burnSuccessCheck);
  const failure = testCases.filter(burnFailureCheck).map(burnMessage);

  return { Success: success, Failure: failure };
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}
function burnTestCases(): BurnParams[] {
  const testCases = [{ liquidityIn: 132697204941179723912n }];
  return testCases;
}

export interface Burn {
  Success: BurnParams[];
  Failure: {
    params: BurnParams;
    errorMessage: string;
  }[];
}

export interface BurnParams {
  liquidityIn: bigint;
}

function burnSuccessCheck({ liquidityIn }: { liquidityIn: bigint }): boolean {
  if (liquidityIn > 0n) {
    return true;
  } else {
    return false;
  }
}

function burnFailureCheck(value: { liquidityIn: bigint }): boolean {
  return burnSuccessCheck(value);
}

function burnMessage(params: BurnParams): {
  params: BurnParams;
  errorMessage: string;
} {
  if (params.liquidityIn > 0n) {
    return { params, errorMessage: "Invalid" };
  } else {
    return { params, errorMessage: "" };
  }
}

//lend
export function lend(): Lend {
  const mintTests = mintTestCases();
  const lendTests = lendTestCases();

  const testCases = mintTests.flatMap((mintParams) => {
    return lendTests.map((lendParams) => {
      return { mintParams, lendParams };
    });
  });

  const success = testCases.filter(lendSuccessCheck);
  const failure = testCases.filter(lendFailureCheck).map(lendMessage);

  return { Success: success, Failure: failure };
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}

function lendTestCases(): LendParams[] {
  const testCases = [
    { assetIn: 100n, interestDecrease: 0n, cdpDecrease: 2n },
    { assetIn: 100n, interestDecrease: 0n, cdpDecrease: 0n },
  ];

  return testCases;
}

export interface Lend {
  Success: { mintParams: MintParams; lendParams: LendParams }[];
  Failure: {
    mintParams: MintParams;
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
  mintParams: MintParams;
  lendParams: LendParams;
}): boolean {
  if (!mintSuccessCheck(params.mintParams)) {
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
  mintParams: MintParams;
  lendParams: LendParams;
}): boolean {
  return !lendSuccessCheck(value);
}

function lendMessage({
  mintParams,
  lendParams,
}: {
  mintParams: MintParams;
  lendParams: LendParams;
}): {
  mintParams: MintParams;
  lendParams: LendParams;
  errorMessage: string;
} {
  if (mintMessage(mintParams).errorMessage !== "") {
    return {
      mintParams,
      lendParams,
      errorMessage: mintMessage(mintParams).errorMessage,
    };
  } else if (
    !(lendParams.interestDecrease > 0n && lendParams.cdpDecrease > 0n)
  ) {
    return { mintParams, lendParams, errorMessage: "Invalid" };
  } else {
    return { mintParams, lendParams, errorMessage: "" };
  }
}

export function borrow(): Borrow {
  const mintTests = mintTestCases();
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
//withdraw

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
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}

function borrowTestCases(): BorrowParams[] {
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
function withdrawTestCases(): WithdrawParams[] {
  const testCases = [
    // { claimsIn: { bond: 100n, insurance: 1n } },
    { claimsIn: { bond: 100n, insurance: 37n } },
    // { claimsIn: 1000n },
  ];

  return testCases;
}

export interface Borrow {
  Success: { mintParams: MintParams; borrowParams: BorrowParams }[];
  Failure: {
    mintParams: MintParams;
    borrowParams: BorrowParams;
    errorMessage: string;
  }[];
}
export interface Withdraw {
  Success: WithdrawParams[];
  Failure: {
    params: WithdrawParams;
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
  mintParams: MintParams;
  borrowParams: BorrowParams;
}): boolean {
  if (!mintSuccessCheck(params.mintParams)) {
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
  mintParams: MintParams;
  borrowParams: BorrowParams;
}): boolean {
  return !borrowSuccessCheck(value);
}

function borrowMessage({
  mintParams,
  borrowParams,
}: {
  mintParams: MintParams;
  borrowParams: BorrowParams;
}): {
  mintParams: MintParams;
  borrowParams: BorrowParams;
  errorMessage: string;
} {
  if (mintMessage(mintParams).errorMessage !== "") {
    return {
      mintParams,
      borrowParams,
      errorMessage: mintMessage(mintParams).errorMessage,
    };
  } else if (
    !(borrowParams.interestIncrease > 0n || borrowParams.cdpIncrease > 0n)
  ) {
    return { mintParams, borrowParams, errorMessage: "Invalid" };
  } else {
    return { mintParams, borrowParams, errorMessage: "" };
  }
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
export interface Pay {
  // Type '{ mintTests: MintParams[]; borrowTests: BorrowParams[]; 0: any; payTests: PayParams[]; }' is missing the following properties from type '{ mintParams: MintParams; borrowParams: BorrowParams; payParams: PayParams; }': mintParams, borrowParams, payParamsts(2739)

  Success: { mintParams: MintParams[]; borrowParams: BorrowParams[]; payParams: PayParams[] };
  Failure: {
    mintParams: MintParams;
    borrowParams: BorrowParams;
    payParams: PayParams;
    errorMessage: string;
  }[];
}

// TODO: to assign a type to the return value
export function pay(): any {
  const mintTests = mintTestCases(); // getting the mint Test Cases
  const lendTests = lendTestCases(); // getting the lend Test Cases
  const borrowTests = borrowTestCases(); // getting the borrow Test Cases
  const payTests = payTestCases(borrowTests[0]);
  // const payTestFail = payTestCaseFailure(borrowTests[0])

  const successTestCase = {mintTests,borrowTests,payTests};
  // const failureTestCase = {mintTests, borrowTests, payTestFail}

  return { Success: successTestCase };
}
function payTestCases(borrowParams: BorrowParams): PayParams[] {
  // TODO: we should not be passing in the id, we should rather we pulling out the id from the contract
  const testCases = [
    {ids : [1n], debtIn: [borrowParams.assetOut], collateralOut: [borrowParams.collateralIn]}
  ]
  return testCases;
}

function payTestCaseFailure(borrowParams: BorrowParams): PayParams[] {
  const testCases = [
    {ids : [], debtIn: [borrowParams.assetOut], collateralOut: [borrowParams.collateralIn]}
  ];
  return testCases;
}
export interface PayParams {
  ids: bigint[];
  debtIn: bigint[];
  collateralOut: bigint[]
}
function paySuccessCheck(params: {mintParams: MintParams,borrowParams: BorrowParams,
  payParams: PayParams}): boolean {
  if (
    params.payParams.ids.length == params.payParams.debtIn.length &&
    params.payParams.ids.length == params.payParams.collateralOut.length &&
    params.payParams.ids.length > 0
  ) {
    return true;
  } else {
    return false;
  }
}

function payFailureCheck(params: {mintParams: MintParams,borrowParams: BorrowParams,
  payParams: PayParams}): boolean {
  return !paySuccessCheck(params);
}

function payMessage({
  mintParams,
  borrowParams,
  payParams
}: {
  mintParams: MintParams;
  borrowParams: BorrowParams;
  payParams: PayParams;
}): {
  mintParams: MintParams;
  borrowParams: BorrowParams;
  payParams: PayParams;
  errorMessage: string;
} {
  if (paySuccessCheck({mintParams,borrowParams, payParams})) {
    return { mintParams,borrowParams, payParams,  errorMessage: "Invalid" };
  } else {
    return { mintParams,borrowParams, payParams, errorMessage: "" };
  }
}
export default { mint, lend, burn, borrow, withdraw, pay };
