import { ethers, } from 'hardhat'
import { constructorFixture, borrowFixture, mintFixture, Fixture, borrowError, payFixture } from '../shared/Fixtures'
import * as TestCases from '../testCases'
import { expect } from '../shared/Expect'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { Borrow, BorrowParams, MintParams, PayParams } from '../testCases'

const MaxUint224 = BigNumber.from(2).pow(224).sub(1)
let signers: SignerWithAddress[];
let assetInValue: bigint = BigInt(MaxUint224.toString());
let collateralInValue: bigint = BigInt(MaxUint224.toString());
let totalCases: number;
let FailureCases: number;

describe('Pay', () => {
  let tests: any;

  before(async () => {
    signers = await ethers.getSigners();
    tests = await TestCases.pay();
  });

  it('', () => {
    tests.forEach((testCase: Borrow) => {
      describe("", async () => {
        let pair: any;
        let pairSim: any;

        before(async () => {
          try {
            const constructor = await constructorFixture(assetInValue, collateralInValue, testCase.maturity);
            const mintParameters: any = {
              assetIn: testCase.assetIn,
              collateralIn: testCase.collateralIn,
              interestIncrease: testCase.interestIncrease,
              cdpIncrease: testCase.cdpIncrease,
              maturity: testCase.maturity,
              // currentTimeStamp: testCase.currentTimeStamp
            };
            const mint = await mintFixture(constructor, signers[0], mintParameters);
            const borrowParams: BorrowParams =
            {
              assetOut: testCase.borrowAssetOut,
              collateralIn: testCase.borrowCollateralIn,
              interestIncrease: testCase.borrowInterestIncrease,
              cdpIncrease: testCase.borrowCdpIncrease
            }
            const borrowTxData = (await borrowFixture(mint, signers[0], borrowParams));
            
            //TODO: pay the debt using other account
            //TODO: check the amount of collateral received is proportionate

            const debtData:PayParams = {
              ids: [borrowTxData.debtObj.id],
              debtIn: [borrowTxData.debtObj.dueOut.debt],
              collateralOut: [borrowTxData.debtObj.dueOut.collateral]
            }
            const returnValue = await payFixture(borrowTxData,signers[0],debtData);
            pair = returnValue.pair;
            pairSim = returnValue.pairSim;

          } catch (error) {
            console.log(error);
            // describe("Testing for Failure Cases", async () => {
            //   before(async () => {
            //     const constructor = await constructorFixture(assetInValue, collateralInValue, testCase.maturity);
            //     const mintParameters: MintParams = {
            //       assetIn: testCase.assetIn,
            //       collateralIn: testCase.collateralIn,
            //       interestIncrease: testCase.interestIncrease,
            //       cdpIncrease: testCase.cdpIncrease,
            //       maturity: testCase.maturity,
            //       currentTimeStamp: testCase.currentTimeStamp
            //     };
            //     const returnObj = await mintFixture(constructor, signers[0], mintParameters);
            //     pair = returnObj.pair;
            //     pairSim = returnObj.pairSim;
            //   });
            //   it("Lend Tx should fail", async () => {
            //     const borrowParams: BorrowParams =
            //     {
            //       assetOut: testCase.borrowAssetOut,
            //       collateralIn: testCase.borrowCollateralIn,
            //       interestIncrease: testCase.borrowInterestIncrease,
            //       cdpIncrease: testCase.borrowCdpIncrease
            //     }
            //     await expect(pair.pairContractCallee
            //       .connect(signers[0])
            //       .borrow(pair.maturity, signers[0].address, signers[0].address, borrowParams.assetOut, borrowParams.interestIncrease, borrowParams.cdpIncrease)).to.be.reverted;
            //   });
            // })
          }
        });

        it('', async () => {
          if (pair != undefined && pairSim != undefined) {
            console.log("Should have correct reserves");
            const reserves = await pair.totalReserves()
            const reservesSim = pairSim.getPool(testCase.maturity).state.reserves
            expect(reserves.asset).to.equalBigInt(reservesSim.asset)
            expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)

            console.log("Should have correct state");
            const state = await pair.state()
            const stateSim = pairSim.getPool(testCase.maturity).state
            expect(state.asset).to.equalBigInt(stateSim.asset)
            expect(state.interest).to.equalBigInt(stateSim.interest)
            expect(state.cdp).to.equalBigInt(stateSim.cdp)

            console.log("Should have correct total liquidity");
            const liquidity = await pair.totalLiquidity()
            const liquiditySim = pairSim.getPool(testCase.maturity).state.totalLiquidity
            expect(liquidity).to.equalBigInt(liquiditySim)

            console.log("Should have correct liquidity of");
            const signers = await ethers.getSigners()
            const liquidityOf = await pair.liquidityOf(signers[0])
            const liquidityOfSim = pairSim.getLiquidity(pairSim.getPool(testCase.maturity), signers[0].address)
            expect(liquidityOf).to.equalBigInt(liquidityOfSim)

            console.log("Should have correct total debt");

            const totalDebtCreated = await pair.totalDebtCreated()
            const totalDebtCreatedSim = pairSim.getPool(testCase.maturity).state.totalDebtCreated
            expect(totalDebtCreated).to.equalBigInt(totalDebtCreatedSim);

            console.log("Should have correct total claims");
            const claims = await pair.totalClaims()
            const claimsSim = pairSim.getPool(testCase.maturity).state.totalClaims
            expect(claims.bond).to.equalBigInt(claimsSim.bond)
            expect(claims.insurance).to.equalBigInt(claimsSim.insurance)

            console.log("Should have correct claims of");

            const claimsOf = await pair.claimsOf(signers[0])
            const claimsOfSim = pairSim.getClaims(pairSim.getPool(testCase.maturity), signers[0].address)
            expect(claimsOf.bond).to.equalBigInt(claimsOfSim.bond)
            expect(claimsOf.insurance).to.equalBigInt(claimsOfSim.insurance)

            console.log("Should have correct dues of");
            const duesOf = await pair.duesOf()
            const duesOfSim = pairSim.getDues(pairSim.getPool(testCase.maturity), signers[0].address).due
            expect(duesOf.length).to.equal(duesOfSim.length)
            for (let i = 0; i < duesOf.length; i++) {
              expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
              expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
              expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
            }
          }
        })

      })
    })
  })
});


// describe('Pay', () => {
//   //TODO: to work on the payTests
//   // const payTests = testCases.pay();
//   const tests = {
//     Success: [
//       {
//         mintParams:
//         {
//           assetIn: 2000n,
//           collateralIn: 800n,
//           interestIncrease: 20n,
//           cdpIncrease: 400n
//         },
//         borrowParams:
//         {
//           assetOut: 200n,
//           collateralIn: 72n,
//           interestIncrease: 1n,
//           cdpIncrease: 2n
//         },
//         payParams:
//           { ids: [0n], debtIn: [200n], collateralOut: [50n] } //FIXME: we have changed the collateralOut
//       }
//     ],
//   };

//   async function fixture(): Promise<Fixture> {
//     maturity = (await now()) + 31536000n
//     signers = await ethers.getSigners()
//     const constructor = await constructorFixture(100000n, 100000n, (await now()) + 31536000n)
//     //return { pair, pairSim, assetToken, collateralToken }
//     return constructor
//   }
//   //TODO: A hack around setting an ew state for failure test, a way has to be figured to re run the fixture by clearing the snapshot
//   async function fixture1(): Promise<Fixture> {
//     maturity = (await now()) + 31536000n
//     signers = await ethers.getSigners()
//     const constructor = await constructorFixture(100000n, 100000n, (await now()) + 31536000n)
//     //return { pair, pairSim, assetToken, collateralToken }
//     return constructor
//   }

//   // TODO: we are getting an object of mintCases, BorrowCases and payCases
//   // TODO: Need to restructure the testCases.pay to send in an array of the test cases
//   tests.Success.forEach((test, idx) => {
//     describe(`Success case ${idx + 1} for pay`, () => {
//       async function fixtureSuccess(): Promise<Fixture> {
//         const { mintParams, borrowParams, payParams } = test

//         const signers = await ethers.getSigners()
//         const constructor = await loadFixture(fixture)

//         const mint = await mintFixture(constructor, signers[0], mintParams)
        
//         const borrow = await borrowFixture(mint, signers[0], borrowParams)
//         await advanceTimeAndBlock(31535000)  
//         const pay = await payFixture(
//           borrow,
//           signers[0],
//           payParams
//         )
//         return pay
//       }
//       it('Should have correct total reserves', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)

//         const reserves = await pair.totalReserves()
//         const reservesSim = pairSim.getPool(maturity).state.reserves

//         checkBigIntEquality(reserves.asset,reservesSim.asset)
//         checkBigIntEquality(reserves.collateral,reservesSim.collateral)
//       })

//       it('Should have correct state', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)

//         const state = await pair.state()
//         const stateSim = pairSim.getPool(maturity).state

//         checkBigIntEquality(state.asset,stateSim.asset)
//         checkBigIntEquality(state.interest,stateSim.interest)
//         checkBigIntEquality(state.cdp,stateSim.cdp)
//       })


//       it('Should have correct total liquidity', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)

//         const liquidity = await pair.totalLiquidity()
//         const liquiditySim = pairSim.getPool(maturity).state.totalLiquidity

//         checkBigIntEquality(liquidity,liquiditySim)
//       })

//       it('Should have correct liquidity of', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)
//         const signers = await ethers.getSigners()

//         const liquidityOf = await pair.liquidityOf(signers[0])
//         const liquidityOfSim = pairSim.getLiquidity(pairSim.getPool(maturity), signers[0].address)

//         checkBigIntEquality(liquidityOf,liquidityOfSim)
//       })
//       it('Should have correct total debt', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)
//         const signers = await ethers.getSigners()

//         const totalDebtCreated = await pair.totalDebtCreated()
//         const totalDebtCreatedSim = pairSim.getPool(maturity).state.totalDebtCreated

//         checkBigIntEquality(totalDebtCreated,totalDebtCreatedSim)
//       })
//       it('Should have correct total claims', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)

//         const claims = await pair.totalClaims()
//         const claimsSim = pairSim.getPool(maturity).state.totalClaims

//         checkBigIntEquality(claims.bond,claimsSim.bond)
//         checkBigIntEquality(claims.insurance,claimsSim.insurance)
//       })

//       it('Should have correct claims of', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)
//         const signers = await ethers.getSigners()

//         const claimsOf = await pair.claimsOf(signers[0])
//         const claimsOfSim = pairSim.getClaims(pairSim.getPool(maturity),signers[0].address)

//         checkBigIntEquality(claimsOf.bond,claimsOfSim.bond)
//         checkBigIntEquality(claimsOf.insurance,claimsOfSim.insurance)
//       })

//       it('Should have correct dues of', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)
//         const signers = await ethers.getSigners()

//         const duesOf = await pair.duesOf()
//         const duesOfSim = pairSim.getDues(pairSim.getPool(maturity),signers[0].address).due

//         expect(duesOf.length).to.equal(duesOfSim.length)

//         for (let i = 0; i < duesOf.length; i++) {
//           checkBigIntEquality(duesOf[i].collateral,duesOfSim[i].collateral)
//           checkBigIntEquality(duesOf[i].debt,duesOfSim[i].debt)
//           checkBigIntEquality(duesOf[i].startBlock,duesOfSim[i].startBlock)
//         }
//       })
//     })

//     // })
//   })
  
//   describe(`Failure case`, () => {
//     it('Should fail with correct error', async () => {
  
//       const {mintParams, borrowParams, payParams} = tests.Success[0]

//       const constructor = await loadFixture(fixture1)

//       const signers = await ethers.getSigners()


//       // This is passing, but won't fail for a wrong error message
//       // Think it is due to the `await txn.wait()`
//       // const result = pair.upgrade(signers[0]).mint(test.interestIncrease, test.cdpIncrease)
//       // await expect(result).to.be.revertedWith(test.errorMessage)
//       const mint = await mintFixture(constructor,signers[0],mintParams);
//       const {pair} =await borrowFixture(mint,signers[0],borrowParams,true)
//       await expect( pair.pairContractCallee
//       .connect(signers[0])
//       .pay(
//         pair.maturity,
//         signers[0].address,
//         signers[0].address,
//         payParams.ids,
//         payParams.debtIn,
//         payParams.collateralOut
//       )
//     ).to.be.revertedWith('Forbidden');
//   })
// })

//   })