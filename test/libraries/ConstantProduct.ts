export function checkConstantProduct(
  state: {
    asset: bigint
    interest: bigint
    cdp: bigint
  },
  assetReserve: bigint,
  interestAdjusted: bigint,
  cdpAdjusted: bigint
): boolean {
  console.log('state ts ', state)
  console.log('params ts ', assetReserve, interestAdjusted, cdpAdjusted)
  const currentProduct = ((state.interest * state.cdp) << 32n) * state.asset
  const newProduct = interestAdjusted * cdpAdjusted * assetReserve

  console.log('product ts ', currentProduct, newProduct)
  console.log('sub ts', newProduct - currentProduct)
  if (newProduct >= currentProduct) return true
  return false
}

export default {
  checkConstantProduct,
}
