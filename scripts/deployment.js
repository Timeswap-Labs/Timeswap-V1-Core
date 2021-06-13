const { web3 } = require('hardhat')

const TimeswapFactory = artifacts.require('TimeswapFactory')
const TimeswapPool = artifacts.require('TimeswapPool')
const Insurance = artifacts.require('Insurance')
const Bond = artifacts.require('Bond')
const CollateralizedDebt = artifacts.require('CollateralizedDebt')

const setter = '0x72E5Be33d15fbaFadbf982435dbE6281E92eFcA4'
const transactionFee = 30
const protocolFee = 30

async function main() {
  const timeswapPool = await TimeswapPool.new()
  const bond = await Bond.new()
  const insurance = await Insurance.new()
  const collateralizedDebt = await CollateralizedDebt.new()

  const timeswapFactory = await TimeswapFactory.new(
    setter,
    setter,
    timeswapPool.address,
    insurance.address,
    bond.address,
    collateralizedDebt.address,
    transactionFee,
    protocolFee
  )

  console.log('Timeswap Factory deployed to:', timeswapFactory.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
