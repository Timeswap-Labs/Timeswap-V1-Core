export function mint(): {
  Success: {
    interestIncrease: bigint
    cdpIncrease: bigint
  }[]
  Failure: {
    interestIncrease: bigint
    cdpIncrease: bigint
    errorMessage: string
  }[]
} {
  const testCases = [
    { interestIncrease: 1n, cdpIncrease: 4n },
    { interestIncrease: 0n, cdpIncrease: 0n },
  ]

  const success = testCases.filter(mintSuccessCheck)
  const failure = testCases.filter(mintFailureCheck).map(mintMessage)

  return { Success: success, Failure: failure }
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}

function mintSuccessCheck({
  interestIncrease,
  cdpIncrease,
}: {
  interestIncrease: bigint
  cdpIncrease: bigint
}): boolean {
  if (interestIncrease > 0n && cdpIncrease > 0n) {
    return false
  } else {
    return true
  }
}

function mintFailureCheck(value: { interestIncrease: bigint; cdpIncrease: bigint }): boolean {
  return !mintSuccessCheck(value)
}

function mintMessage({ interestIncrease, cdpIncrease }: { interestIncrease: bigint; cdpIncrease: bigint }): {
  interestIncrease: bigint
  cdpIncrease: bigint
  errorMessage: string
} {
  if (interestIncrease > 0n && cdpIncrease > 0n) {
    return { interestIncrease, cdpIncrease, errorMessage: 'Invalid' }
  } else {
    return { interestIncrease, cdpIncrease, errorMessage: '' }
  }
}

export default { mint }
