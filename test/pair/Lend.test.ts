import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
import { constructorFixture, Fixture, lendFixture, mintFixture } from '../shared/Fixtures'
import * as TestCases from '../testCases'
import { expect } from '../shared/Expect'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { Lend, LendParams, MintParams } from '../testCases'

const { loadFixture, solidity } = waffle

const MaxUint224 = BigNumber.from(2).pow(224).sub(1)

let signers: SignerWithAddress[];

let assetInValue: bigint = BigInt(MaxUint224.toString());
let collateralInValue: bigint = BigInt(MaxUint224.toString());

describe('Lend', () => {
  let tests: any;
  let pair: any;
  let pairSim: any;

  before(async () => {
    signers = await ethers.getSigners();
    tests = await TestCases.lend();
    console.log(tests.length);
  });

  it('', () => {
    tests.forEach((testCase: Lend) => {
      describe("", () => {
        async function fixture(): Promise<Fixture> {
          const constructor = await constructorFixture(assetInValue, collateralInValue, testCase.maturity);
          const mintParameters: MintParams = {
            assetIn: testCase.assetIn,
            collateralIn: testCase.collateralIn,
            interestIncrease: testCase.interestIncrease,
            cdpIncrease: testCase.cdpIncrease,
            maturity: testCase.maturity,
            currentTimeStamp: testCase.currentTimeStamp
          };
          const mint = await mintFixture(constructor, signers[0], mintParameters);
          return mint;
        }

        async function fixtureSuccess(): Promise<Fixture> {
          const mint = await loadFixture(fixture);
          const lendParams: LendParams =
          {
            assetIn: testCase.lendAssetIn,
            interestDecrease: testCase.lendInterestDecrease,
            cdpDecrease: testCase.lendCdpDecrease
          }
          return lendFixture(mint, signers[0], lendParams);
        }

        it("", async () => {
          console.log("ABDEFG");
          try {
            console.log("calling the fixtureSuccess");
            const returnObj = await loadFixture(fixtureSuccess);
            pair = returnObj.pair;
            pairSim = returnObj.pairSim;
            it('Should have correct total reserves', async () => {
              const reserves = await pair.totalReserves()
              const reservesSim = pairSim.getPool(testCase.maturity).state.reserves
              console.log(reserves.asset==reservesSim.asset, "CHECKING ASSET Value");
              expect(reserves.asset).to.equalBigInt(reservesSim.asset)
              expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
            })
          } catch (errorMessage) {
            throw errorMessage;
          }
        })
      })
    });
  })
})

  // it('', async () => {
  //   let pair: any;
  //   let pairSim: any;

  //   tests.Success.forEach((test: any, idx: number) => {
  //     describe(`Success case ${idx + 1}`, () => {
  //       const { mintParams, lendParams } = test;

  //       async function fixture(): Promise<Fixture> {
  //         const constructor = await constructorFixture(assetInValue, collateralInValue, mintParams.maturity);
  //         const mint = await mintFixture(constructor, signers[0], mintParams);
  //         return mint;
  //       }

  //       async function fixtureSuccess(): Promise<Fixture | undefined> {
  //         let lend: any;
  //         const mint = await loadFixture(fixture);
  //         try {
  //           lend = await lendFixture(mint, signers[0], lendParams);
  //           return lend;
  //         } catch (error) {
  //           throw Error;
  //         }
  //       }

  //       before(async () => {
  //         signers = await ethers.getSigners();
  //         try {
  //           const returnObj = await loadFixture(fixtureSuccess);
  //           if (returnObj != undefined) {
  //             pair = returnObj.pair;
  //             pairSim = returnObj.pairSim;
  //           }
  //         } catch (error) {
  //           console.log("THERE WAS AN ERROR IN THE LOADFIXTURE(FIXTURESUCCESS");
  //           throw Error;
  //         }
  //       })

  //       it('Should have correct total reserves', async () => {
  //         const reserves = await pair.totalReserves()
  //         const reservesSim = pairSim.getPool(mintParams.maturity).state.reserves

  //         expect(reserves.asset).to.equalBigInt(reservesSim.asset)
  //         expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
  //       })

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
        // })



  //       
  //     });
  //   })



  //     // await describe(`Testing for Failure Cases:`, () => {
  //     //   tests.Success.forEach((failureObject: any,idx: number})  => {
  //     //     describe(` Success case ${idx + 1}`, () => {
  //     //       const { mintParams, lendParams } = test.Success[idx];

  //     //       async function fixture(): Promise<Fixture> {
  //     //         const constructor = await constructorFixture(assetInValue, collateralInValue, mintParams.maturity);
  //     //         const mint = await mintFixture(constructor, signers[0], mintParams);
  //     //         return mint;
  //     //       }

  //     //       async function fixtureSuccess(): Promise<Fixture | undefined>  {
  //     //         let lend: any;
  //     //         const mint = await loadFixture(fixture);
  //     //         try {
  //     //           lend = await lendFixture(mint, signers[0], lendParams);
  //     //           return lend;
  //     //         } catch (error) {
  //     //           FailureTests.push(test);
  //     //           throw Error;
  //     //         }
  //     //       }

  //     //       before(async () => {
  //     //         signers = await ethers.getSigners();
  //     //         try {
  //     //           const returnObj = await loadFixture(fixtureSuccess);
  //     //           if (returnObj != undefined) {
  //     //             pair = returnObj.pair;
  //     //             pairSim = returnObj.pairSim;
  //     //           }
  //     //         } catch (error) {
  //     //           console.log("THERE WAS AN ERROR IN THE LOADFIXTURE(FIXTURESUCCESS");
  //     //           throw Error;
  //     //         }
  //     //       })

  //     //       it('Should have correct total reserves', async () => {
  //     //         const reserves = await pair.totalReserves()
  //     //         const reservesSim = pairSim.getPool(mintParams.maturity).state.reserves

  //     //         expect(reserves.asset).to.equalBigInt(reservesSim.asset)
  //     //         expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
  //     //       })


  //     //     })
  //     //   });
  //     })

    //   describe(`Failure test case ${idx + 1}`, () => {
    //     async function fixture(): Promise<Fixture> {
    //       const constructor = await constructorFixture(assetInValue, collateralInValue, mintParams.maturity);
    //       const mint = await mintFixture(constructor, signers[0], mintParams);
    //       return mint;
    //     }

    //     async function fixtureSuccess(): Promise<Fixture | undefined>  {
    //       let lend: any;
    //       const mint = await loadFixture(fixture);
    //       try {
    //         lend = await lendFixture(mint, signers[0], lendParams);
    //         return lend;
    //       } catch (error) {
    //         FailureTests.push(test);
    //         throw Error;
    //       }
    //     }

    //     before(async () => {
    //       signers = await ethers.getSigners();
    //       try {
    //         const returnObj = await loadFixture(fixtureSuccess);
    //         if (returnObj != undefined) {
    //           pair = returnObj.pair;
    //           pairSim = returnObj.pairSim;
    //         }
    //       } catch (error) {
    //         console.log("THERE WAS AN ERROR IN THE LOADFIXTURE(FIXTURESUCCESS");
    //         throw Error;
    //       }
    //     })

    //     it('Should have correct total reserves', async () => {
    //       const reserves = await pair.totalReserves()
    //       const reservesSim = pairSim.getPool(mintParams.maturity).state.reserves

    //       expect(reserves.asset).to.equalBigInt(reservesSim.asset)
    //       expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
    //     })

    // })


    // tests.Failure.forEach((test: any, idx: number) => {
    //   const { mintParams, lendParams } = test;
    //   describe(`Failure case ${idx + 1}`, () => {
    //     async function fixture(): Promise<Fixture> {
    //       const constructor = await constructorFixture(assetInValue, collateralInValue, mintParams.maturity);
    //       const mint = await mintFixture(constructor, signers[0], mintParams);
    //       console.log("miniting done");
    //       return mint;
    //     }

    //     before(async () => {
    //       signers = await ethers.getSigners();
    //     })

    //     it('Should fail', async () => {
    //       const mint = await loadFixture(fixture);
    //       try {
    //         await lendFixture(mint, signers[0], lendParams);
    //       } catch (error) {
    //         console.log(error);
    //       }

    //     })
