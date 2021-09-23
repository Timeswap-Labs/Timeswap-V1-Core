export interface Tokens {
  asset: bigint
  collateral: bigint
}

export function tokensDefault(): Tokens {
  return { asset: 0n, collateral: 0n }
}

export interface Claims {
  bond: bigint
  insurance: bigint
}

export function claimsDefault(): Claims {
  return { bond: 0n, insurance: 0n }
}

export interface Due {
  debt: bigint
  collateral: bigint
  startBlock: bigint
}

export function dueDefault(): Due {
  return { debt: 0n, collateral: 0n, startBlock: 0n }
}

export interface State {
  asset: bigint
  interest: bigint
  cdp: bigint
}

export function stateDefault(): State {
  return { asset: 0n, interest: 0n, cdp: 0n }
}

export interface Pool {
  state: State
  lock: Tokens
  ownerLiquidity: bigint
  senderLiquidity: bigint
  totalLiquidity: bigint
  totalDebt:bigint
  totalClaims: Claims
}

export function poolDefault(): Pool {
  return {
    state: stateDefault(),
    lock: tokensDefault(),
    ownerLiquidity: 0n,
    senderLiquidity: 0n,
    totalLiquidity: 0n,
    totalDebt: 0n,
    totalClaims: claimsDefault(),
  }
}

export default {
  tokensDefault,
  claimsDefault,
  dueDefault,
  stateDefault,
  poolDefault,
}
