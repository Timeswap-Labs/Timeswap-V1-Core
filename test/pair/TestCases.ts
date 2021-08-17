export function mint(): Mint {
  const testCases = [
    { assetIn: 2000n, collateralIn: 2000n, interestIncrease: 1n, cdpIncrease: 4n },
    { assetIn: 2000n, collateralIn: 2000n, interestIncrease: 0n, cdpIncrease: 0n },
  ]

  const success = testCases.filter(mintSuccessCheck)
  const failure = testCases.filter(mintFailureCheck).map(mintMessage)

  return { Success: success, Failure: failure }
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}

interface Mint {
  Success: MintParams[]
  Failure: {
    params: MintParams
    errorMessage: string
  }[]
}

interface MintParams {
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

function mintFailureCheck(value: MintParams): boolean {
  return !mintSuccessCheck(value)
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
export function burn(): {
  Success: {
    liquidityIn: bigint
  }[]
  Failure: {
    liquidityIn: bigint
    errorMessage: string
  }[]
} {
  const testCases = [{ liquidityIn: 1n }, { liquidityIn: 0n }]

  const success = testCases.filter(burnSuccessCheck)
  const failure = testCases.filter(burnFailureCheck).map(burnMessage)

  return { Success: success, Failure: failure }
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}

function burnSuccessCheck({ liquidityIn }: { liquidityIn: bigint }): boolean {
  if (liquidityIn > 0n) {
    return true
  } else {
    return false
  }
}

function burnFailureCheck(value: { liquidityIn: bigint }): boolean {
  return burnSuccessCheck(value)
}

function burnMessage({ liquidityIn }: { liquidityIn: bigint }): {
  liquidityIn: bigint
  errorMessage: string
} {
  if (liquidityIn > 0n) {
    return { liquidityIn, errorMessage: 'Invalid' }
  } else {
    return { liquidityIn, errorMessage: '' }
  }
}

export default { mint, burn }

