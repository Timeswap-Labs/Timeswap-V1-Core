export function mint() {
  return { Success: [{ interestIncrease: 1n, cdpIncrease: 4n }], Failure: [{ interestIncrease: 0n, cdpIncrease: 0n }] }
  // generate random inputs based on some rule
  // check which inputs will pass
  // check which inputs will fail with which error
  // pass inputs array and fail inputs array
}

function mintCheck(interestIncrease: bigint, cdpIncrease: bigint): string | null {
  if (interestIncrease > 0n && cdpIncrease > 0n) {
    return 'Invalid'
  } else {
    return null
  }
}

export default { mint }
