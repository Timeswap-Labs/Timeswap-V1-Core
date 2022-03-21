export interface Burn {
  Success: BurnParams[]
  Failure: {
    params: BurnParams
    errorMessage: string
  }[]
}
export interface BurnParams {
  liquidityIn: bigint
}
