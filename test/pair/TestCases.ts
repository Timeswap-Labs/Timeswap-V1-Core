export function mint(): Mint {
  const testCases = mintTestCases()

  const success = testCases.filter(mintSuccessCheck)
  const failure = testCases.filter(mintFailureCheck).map(mintMessage)

  return { Success: success, Failure: failure }
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}

function mintTestCases(): MintParams[] {
  const testCases = [
    { assetIn: 2000n, collateralIn: 2000n, interestIncrease: 20n, cdpIncrease: 400n },
    { assetIn: 2000n, collateralIn: 2000n, interestIncrease: 0n, cdpIncrease: 0n },
  ]

  return testCases
}

export interface Mint {
  Success: MintParams[]
  Failure: {
    params: MintParams
    errorMessage: string
  }[]
}

export interface MintParams {
  assetIn: bigint
  collateralIn: bigint
  interestIncrease: bigint
  cdpIncrease: bigint
}

function mintSuccessCheck({ interestIncrease, cdpIncrease }: MintParams): boolean {
  if (!(interestIncrease > 0n && cdpIncrease > 0n)) {
    return false
  } else {
    return true
  }
}

function mintFailureCheck(params: MintParams): boolean {
  return !mintSuccessCheck(params)
}

function mintMessage(params: MintParams): {
  params: MintParams
  errorMessage: string
} {
  if (!(params.interestIncrease > 0n && params.cdpIncrease > 0n)) {
    return { params, errorMessage: 'Invalid' }
  } else {
    return { params, errorMessage: '' }
  }
}

export function lend(): Lend {
  const mintTests = mintTestCases()
  const lendTests = lendTestCases()

  const testCases = mintTests.flatMap((mintParams) => {
    return lendTests.map((lendParams) => {
      return { mintParams, lendParams }
    })
  })

  const success = testCases.filter(lendSuccessCheck)
  const failure = testCases.filter(lendFailureCheck).map(lendMessage)

  return { Success: success, Failure: failure }
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}

function lendTestCases(): LendParams[] {
  const testCases = [
    { assetIn: 2000n, interestDecrease: 1n, cdpDecrease: 2n },
    { assetIn: 2000n, interestDecrease: 0n, cdpDecrease: 0n },
  ]

  return testCases
}

export interface Lend {
  Success: { mintParams: MintParams; lendParams: LendParams }[]
  Failure: {
    mintParams: MintParams
    lendParams: LendParams
    errorMessage: string
  }[]
}

export interface LendParams {
  assetIn: bigint
  interestDecrease: bigint
  cdpDecrease: bigint
}

function lendSuccessCheck(params: { mintParams: MintParams; lendParams: LendParams }): boolean {
  if (!mintSuccessCheck(params.mintParams)) {
    return false
  } else if (!(params.lendParams.interestDecrease > 0n || params.lendParams.cdpDecrease > 0n)) {
    return false
  } else {
    return true
  }
}

function lendFailureCheck(value: { mintParams: MintParams; lendParams: LendParams }): boolean {
  return !lendSuccessCheck(value)
}

function lendMessage({ mintParams, lendParams }: { mintParams: MintParams; lendParams: LendParams }): {
  mintParams: MintParams
  lendParams: LendParams
  errorMessage: string
} {
  if (mintMessage(mintParams).errorMessage !== '') {
    return { mintParams, lendParams, errorMessage: mintMessage(mintParams).errorMessage }
  } else if (!(lendParams.interestDecrease > 0n && lendParams.cdpDecrease > 0n)) {
    return { mintParams, lendParams, errorMessage: 'Invalid' }
  } else {
    return { mintParams, lendParams, errorMessage: '' }
  }
}

export function borrow(): Borrow {
  const mintTests = mintTestCases()
  const borrowTests = borrowTestCases()

  const testCases = mintTests.flatMap((mintParams) => {
    return borrowTests.map((borrowParams) => {
      return { mintParams, borrowParams }
    })
  })

  const success = testCases.filter(borrowSuccessCheck)
  const failure = testCases.filter(borrowFailureCheck).map(borrowMessage)

  return { Success: success, Failure: failure }
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}

function borrowTestCases(): BorrowParams[] {
  const testCases = [
    { assetOut: 200n, collateralIn: 72n, interestIncrease: 1n, cdpIncrease: 2n },
    { assetOut: 200n, collateralIn: 72n, interestIncrease: 0n, cdpIncrease: 0n },
  ]

  return testCases
}

export interface Borrow {
  Success: { mintParams: MintParams; borrowParams: BorrowParams }[]
  Failure: {
    mintParams: MintParams
    borrowParams: BorrowParams
    errorMessage: string
  }[]
}

export interface BorrowParams {
  assetOut: bigint
  collateralIn: bigint
  interestIncrease: bigint
  cdpIncrease: bigint
}

function borrowSuccessCheck(params: { mintParams: MintParams; borrowParams: BorrowParams }): boolean {
  if (!mintSuccessCheck(params.mintParams)) {
    return false
  } else if (!(params.borrowParams.interestIncrease > 0n || params.borrowParams.cdpIncrease > 0n)) {
    return false
  } else {
    return true
  }
}

function borrowFailureCheck(value: { mintParams: MintParams; borrowParams: BorrowParams }): boolean {
  return !borrowSuccessCheck(value)
}

function borrowMessage({ mintParams, borrowParams }: { mintParams: MintParams; borrowParams: BorrowParams }): {
  mintParams: MintParams
  borrowParams: BorrowParams
  errorMessage: string
} {
  if (mintMessage(mintParams).errorMessage !== '') {
    return { mintParams, borrowParams, errorMessage: mintMessage(mintParams).errorMessage }
  } else if (!(borrowParams.interestIncrease > 0n || borrowParams.cdpIncrease > 0n)) {
    return { mintParams, borrowParams, errorMessage: 'Invalid' }
  } else {
    return { mintParams, borrowParams, errorMessage: '' }
  }
}

export default { mint, lend, borrow }
