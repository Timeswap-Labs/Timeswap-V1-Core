import { Decimal } from 'decimal.js'
import { ethers, waffle } from 'hardhat'
import { now, pseudoRandomBigUint, pseudoRandomBigUint256 } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as TestCases from '../testCases'
import { constructorFixture, Fixture, mintFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
import { mint } from '../testCases'

const { loadFixture } = waffle
const MaxUint112 = BigNumber.from(2).pow(112).sub(1)
let maturity = 0n
let signers: SignerWithAddress[];

//TODO: Check why chai's native assertion library isnt working and remove the helper function
function checkBigIntEquality(x: bigint, y: bigint) {
  expect(x.toString()).to.equal(y.toString());
}

Decimal.config({ toExpNeg: 0, toExpPos: 500 })

describe('Mint', () => {
  let assetInValue: bigint = pseudoRandomBigUint(MaxUint112); // creating ERC20 with this number
  let collateralInValue: bigint = pseudoRandomBigUint(MaxUint112); // creating ERC20 with this number
  const tests = TestCases.mint();
  //TODO: move the tests back to testcases.ts file

  // const tests = [
  //   {
  //     assetIn: BigInt(((BigNumber.from(assetInValue)).div(BigNumber.from(2).pow(50))).toString()),  // xIncrease
  //     collateralIn: collateralInValue,
  //     interestIncrease: BigInt(((BigNumber.from(assetInValue).div(100000000))).toString()), // yIncrease
  //     cdpIncrease: 41407828134964681949000000n, // zIncrease
  //     // BigInt(((BigNumber.from(assetInValue).div(100))).toString())
  //   },]
  // const testsFailure = [
  //   {
  //     assetIn: 2000n,
  //     collateralIn: 800n,
  //     interestIncrease: 0n,
  //     cdpIncrease: 0n,
  //   },]

  // it('Should have correct total reserves', async () => {
  //   console.log(TestCases.mintTestCases());
  //   console.log("Hi");
  // })

  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 62208000n
    const constructor = await constructorFixture(assetInValue, collateralInValue, maturity)
    // constructor = { pair, pairSim, assetToken, collateralToken }
    return constructor
  }

  tests.Success.forEach((mintParams, idx) => {
    describe(`Success case ${idx + 1}`, () => {
      async function fixtureSuccess(): Promise<Fixture> {
        signers = await ethers.getSigners();
        const constructor = await loadFixture(fixture)
        const mint = await mintFixture(constructor, signers[0], mintParams);
        return mint;
      }

      it('Should have correct total reserves', async () => {
        const { pair, pairSim } = await loadFixture(fixtureSuccess)
        console.log("logging from Should have correct total reserves");


        // const reserves = await pair.totalReserves()
        // const reservesSim = pairSim.getPool(maturity).state.reserves

        // expect(reserves.asset).to.equalBigInt(reservesSim.asset)
        // expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
      })

      // it('Should have correct state', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const state = await pair.state()
      //   const stateSim = pairSim.getPool(maturity).state

      //   expect(state.asset).to.equalBigInt(stateSim.asset)
      //   expect(state.interest).to.equalBigInt(stateSim.interest)
      //   expect(state.cdp).to.equalBigInt(stateSim.cdp)
      // })


      // it('Should have correct total liquidity', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const liquidity = await pair.totalLiquidity()
      //   const liquiditySim = pairSim.getPool(maturity).state.totalLiquidity

      //   expect(liquidity).to.equalBigInt(liquiditySim)
      // })

      // it('Should have correct liquidity of', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
      //   const signers = await ethers.getSigners()

      //   const liquidityOf = await pair.liquidityOf(signers[0])
      //   const liquidityOfSim = pairSim.getLiquidity(pairSim.getPool(maturity), signers[0].address)

      //   expect(liquidityOf).to.equalBigInt(liquidityOfSim)
      // })
      // it('Should have correct total debt', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
      //   const signers = await ethers.getSigners()

      //   const totalDebtCreated = await pair.totalDebtCreated()
      //   const totalDebtCreatedSim = pairSim.getPool(maturity).state.totalDebtCreated

      //   checkBigIntEquality(totalDebtCreated,totalDebtCreatedSim)
      // })
      // it('Should have correct total claims', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

      //   const claims = await pair.totalClaims()
      //   const claimsSim = pairSim.getPool(maturity).state.totalClaims

      //   expect(claims.bond).to.equalBigInt(claimsSim.bond)
      //   expect(claims.insurance).to.equalBigInt(claimsSim.insurance)
      // })

      // it('Should have correct claims of', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
      //   const signers = await ethers.getSigners()

      //   const claimsOf = await pair.claimsOf(signers[0])
      //   const claimsOfSim = pairSim.getClaims(pairSim.getPool(maturity),signers[0].address)

      //   expect(claimsOf.bond).to.equalBigInt(claimsOfSim.bond)
      //   expect(claimsOf.insurance).to.equalBigInt(claimsOfSim.insurance)
      // })

      // it('Should have correct dues of', async () => {
      //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
      //   const signers = await ethers.getSigners()

      //   const duesOf = await pair.duesOf()
      //   const duesOfSim = pairSim.getDues(pairSim.getPool(maturity),signers[0].address).due

      //   expect(duesOf.length).to.equal(duesOfSim.length)

      //   for (let i = 0; i < duesOf.length; i++) {
      //     expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
      //     expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
      //     expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
      //   }
      })
    })
  })

  // testsFailure.forEach((test, idx) => {
  //   describe(`Failure case ${idx + 1}`, () => {
  //     it('Should fail with correct error', async () => {
  //       const mintParams = test
  //       const { pair } = await loadFixture(fixture)
  //       const signers = await ethers.getSigners()

  //       // This is passing, but won't fail for a wrong error message
  //       // Think it is due to the `await txn.wait()`
  //       // const result = pair.upgrade(signers[0]).mint(test.interestIncrease, test.cdpIncrease)
  //       // await expect(result).to.be.revertedWith(test.errorMessage)

  //       await expect(
  //         pair.pairContractCallee
  //           .connect(signers[0])
  //           .mint(
  //             pair.maturity,
  //             signers[0].address,
  //             mintParams.assetIn,
  //             mintParams.interestIncrease,
  //             mintParams.cdpIncrease
  //           )
  //       ).to.be.revertedWith('')
  //     })
  //   })
  // })
// })
