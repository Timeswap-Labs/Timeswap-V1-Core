// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { web3 } = require('hardhat')

const TimeswapFactory = artifacts.require('TimeswapFactory')
const TimeswapPool = artifacts.require('TimeswapPool')
const Insurance = artifacts.require('Insurance')
const Bond = artifacts.require('Bond')
const CollateralizedDebt = artifacts.require('CollateralizedDebt')
const TestToken = artifacts.require('TestToken')

const setter = '0x72E5Be33d15fbaFadbf982435dbE6281E92eFcA4'
const transactionFee = 100
const protocolFee = 100

const weth = '0x02d4418c5eeb5bef366272018f7cd498179fe98b'

const maturity1 = 1628397549
const maturity2 = 1636346349
const maturity3 = 1644307200

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
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

  const testToken1 = await TestToken.new(18)

  console.log('Test Token 1 deployed to:', testToken1.address)

  await timeswapFactory.createPool(testToken1.address, weth, maturity1)
  await timeswapFactory.createPool(testToken1.address, weth, maturity2)
  await timeswapFactory.createPool(testToken1.address, weth, maturity3)
  await timeswapFactory.createPool(weth, testToken1.address, maturity1)

  const pool1 = await TimeswapPool.at(
    await timeswapFactory.getPool(testToken1.address, weth, maturity1)
  )
  const pool2 = await TimeswapPool.at(
    await timeswapFactory.getPool(testToken1.address, weth, maturity2)
  )
  const pool3 = await TimeswapPool.at(
    await timeswapFactory.getPool(testToken1.address, weth, maturity3)
  )
  const pool4 = await TimeswapPool.at(
    await timeswapFactory.getPool(weth, testToken1.address, maturity1)
  )

  console.log('Pool 1 deployed to address:', pool1.address)
  console.log('Pool 2 deployed to address:', pool2.address)
  console.log('Pool 3 deployed to address:', pool3.address)
  console.log('Pool 4 deployed to address:', pool4.address)

  await testToken1.mint(pool1, 2500 * 10 ** 18)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
