import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { expect } from '../shared/Expect'
import { burnFixture, constructorFixture, mintFixture } from '../shared/Fixtures'
import { advanceTimeAndBlock, now } from '../shared/Helper'
import { mint, MintParams } from '../testCases'
const MaxUint224 = BigNumber.from(2).pow(224).sub(1);
let signers: SignerWithAddress[];
let assetInValue: bigint = BigInt(MaxUint224.toString());
let collateralInValue: bigint = BigInt(MaxUint224.toString());
let totalCases: number;
let FailureCases: number;

describe('Burn', () => {
  let tests: any;
  let caseNumber: any = 0;
  let iSuccess = 0;
  let iFailure = 0;
  let totalFailureCases = 0;

  before(async () => {
    signers = await ethers.getSigners();
    tests = await mint();
    totalCases = tests.length;
    FailureCases = 0;
  });

  it('', async () => {
    tests.forEach((testCase: MintParams) => {
      describe("", async () => {
        let pair: any;
        let pairSim: any;
        let updatedMaturity: any


        before(async () => {
          console.log(`Checking for Burn Test Case ${caseNumber + 1}`);
          const currentBlockTime = await now();
          updatedMaturity = currentBlockTime + 10000000n;
          let erm: any;
          try {
            let mint: any;
            try {
              const constructor = await constructorFixture(assetInValue, collateralInValue, updatedMaturity);
              const mintParameters: MintParams = {
                assetIn: testCase.assetIn,
                collateralIn: testCase.collateralIn,
                interestIncrease: testCase.interestIncrease,
                cdpIncrease: testCase.cdpIncrease,
                maturity: updatedMaturity,
                currentTimeStamp: testCase.currentTimeStamp
              };
              mint = await mintFixture(constructor, signers[0], mintParameters);
            } catch (error) {
              erm = "minting error";
              console.log(`Ignored due to wrong miniting parameters`);
              throw Error("minting error");
            }
            erm = undefined;
            await advanceTimeAndBlock(Number(updatedMaturity));
            const burnParams = {liquidityIn:mint.mintData.liquidityOut};
            const burn = await burnFixture(mint,signers[0],burnParams);
            pair = burn.pair;
            pairSim = burn.pairSim;
          } catch (error) {
            //TODO: to work on failure cases
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
            //     const lendParams: LendParams =
            //     {
            //       assetIn: testCase.lendAssetIn,
            //       interestDecrease: testCase.lendInterestDecrease,
            //       cdpDecrease: testCase.lendCdpDecrease
            //     }
            //     await expect(pair.pairContractCallee
            //       .connect(signers[0])
            //       .lend(pair.maturity, signers[0].address, signers[0].address, lendParams.assetIn, lendParams.interestDecrease, lendParams.cdpDecrease)).to.be.reverted;
            //   });
            // })
          }
        });

        it(``, async () => {
          if (pair != undefined && pairSim != undefined) {
            console.log(`Testing for Burn Success Case: ${iSuccess+1}`);
            console.log("Should have correct reserves");
            const reserves = await pair.totalReserves()
            const reservesSim = pairSim.getPool(updatedMaturity).state.reserves
            expect(reserves.asset).to.equalBigInt(reservesSim.asset)
            expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)

            console.log("Should have correct state");
            const state = await pair.state()
            const stateSim = pairSim.getPool(updatedMaturity).state
            expect(state.asset).to.equalBigInt(stateSim.asset)
            expect(state.interest).to.equalBigInt(stateSim.interest)
            expect(state.cdp).to.equalBigInt(stateSim.cdp)

            console.log("Should have correct total liquidity");
            const liquidity = await pair.totalLiquidity()
            const liquiditySim = pairSim.getPool(updatedMaturity).state.totalLiquidity
            expect(liquidity).to.equalBigInt(liquiditySim)

            console.log("Should have correct liquidity of");
            const signers = await ethers.getSigners()
            const liquidityOf = await pair.liquidityOf(signers[0])
            const liquidityOfSim = pairSim.getLiquidity(pairSim.getPool(updatedMaturity), signers[0].address)
            expect(liquidityOf).to.equalBigInt(liquidityOfSim)

            console.log("Should have correct total debt");
            
            const totalDebtCreated = await pair.totalDebtCreated()
            const totalDebtCreatedSim = pairSim.getPool(updatedMaturity).state.totalDebtCreated
            expect(totalDebtCreated).to.equalBigInt(totalDebtCreatedSim);

            console.log("Should have correct total claims");
            const claims = await pair.totalClaims()
            const claimsSim = pairSim.getPool(updatedMaturity).state.totalClaims
            expect(claims.bond).to.equalBigInt(claimsSim.bond)
            expect(claims.insurance).to.equalBigInt(claimsSim.insurance)

            console.log("Should have correct claims of");
            
            const claimsOf = await pair.claimsOf(signers[0])
            const claimsOfSim = pairSim.getClaims(pairSim.getPool(updatedMaturity), signers[0].address)
            expect(claimsOf.bond).to.equalBigInt(claimsOfSim.bond)
            expect(claimsOf.insurance).to.equalBigInt(claimsOfSim.insurance)

            console.log("Should have correct dues of");
            const duesOf = await pair.duesOf()
            const duesOfSim = pairSim.getDues(pairSim.getPool(updatedMaturity), signers[0].address).due
            expect(duesOf.length).to.equal(duesOfSim.length)
            for (let i = 0; i < duesOf.length; i++) {
              expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
              expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
              expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
            }
            iSuccess = iSuccess+1;
          } caseNumber++;
        })
      })
    })
  })
});


// describe('Burn', () => {
//   const tests = testCases.burn()
//   const mintTest = testCases.mint()
//   async function fixture(): Promise<Fixture> {
//     maturity = (await now()) + 31536000n
//     signers = await ethers.getSigners()
//     const constructor = await constructorFixture(100000n, 100000n, (await now()) + 31536000n)
//     return constructor
//   }

//   tests.Success.forEach((burnParams, idx) => {
//     describe(`Success case ${idx + 1} for burn`, () => {
//       async function fixtureSuccess(): Promise<Fixture> {
//         await loadFixture(fixture)

//         const signers = await ethers.getSigners()
//         const constructor = await loadFixture(fixture)

//         const mint = await mintFixture(constructor, signers[0], mintTest.Success[0]);
//         advanceTimeAndBlock(31536000)

//         const burn = await burnFixture(mint,signers[0],burnParams)
//         return burn
//       }

//       it('Should have correct total reserves', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)

//         const reserves = await pair.totalReserves()
//         const reservesSim = pairSim.getPool(maturity).state.reserves

//         expect(reserves.asset).to.equalBigInt(reservesSim.asset)
//         expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
//       })

//       it('Should have correct state', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)

//         const state = await pair.state()
//         const stateSim = pairSim.getPool(maturity).state

//         expect(state.asset).to.equalBigInt(stateSim.asset)
//         expect(state.interest).to.equalBigInt(stateSim.interest)
//         expect(state.cdp).to.equalBigInt(stateSim.cdp)
//       })


//       it('Should have correct total liquidity', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)

//         const liquidity = await pair.totalLiquidity()
//         const liquiditySim = pairSim.getPool(maturity).state.totalLiquidity

//         expect(liquidity).to.equalBigInt(liquiditySim)
//       })

//       it('Should have correct liquidity of', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)
//         const signers = await ethers.getSigners()

//         const liquidityOf = await pair.liquidityOf(signers[0])
//         const liquidityOfSim = pairSim.getLiquidity(pairSim.getPool(maturity), signers[0].address)

//         expect(liquidityOf).to.equalBigInt(liquidityOfSim)
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

//         expect(claims.bond).to.equalBigInt(claimsSim.bond)
//         expect(claims.insurance).to.equalBigInt(claimsSim.insurance)
//       })

//       it('Should have correct claims of', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)
//         const signers = await ethers.getSigners()

//         const claimsOf = await pair.claimsOf(signers[0])
//         const claimsOfSim = pairSim.getClaims(pairSim.getPool(maturity),signers[0].address)

//         expect(claimsOf.bond).to.equalBigInt(claimsOfSim.bond)
//         expect(claimsOf.insurance).to.equalBigInt(claimsOfSim.insurance)
//       })

//       it('Should have correct dues of', async () => {
//         const { pair, pairSim } = await loadFixture(fixtureSuccess)
//         const signers = await ethers.getSigners()

//         const duesOf = await pair.duesOf()
//         const duesOfSim = pairSim.getDues(pairSim.getPool(maturity),signers[0].address).due

//         expect(duesOf.length).to.equal(duesOfSim.length)

//         for (let i = 0; i < duesOf.length; i++) {
//           expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
//           expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
//           expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
//         }
//       })
//     })
//   })

//   tests.Failure.forEach((burnParams, idx) => {
//     describe(`Failure case ${idx + 1}`, () => {
//       async function fixtureFailure(): Promise<Fixture> {
//         await loadFixture(fixture)

//         const signers = await ethers.getSigners()
//         const constructor = await loadFixture(fixture)
//         const mint = await mintFixture(constructor, signers[0], mintTest.Success[0]);
//         advanceTimeAndBlock(31536000)
//         const burn = await burnFixture(constructor, signers[0], burnParams.params)
//         return burn
//       }

//       it('Should revert when liquidityIn is less than or equal to 0', async () => {
//         const { pair } = await loadFixture(fixtureFailure)
//         const signers = await ethers.getSigners()
//         const result = pair.upgrade(signers[0]).burn(0n)
//         await expect(result).to.be.revertedWith(burnParams.errorMessage)
//       })
//     })
//   })

//   //TODO: this is not needed, duplicate from the constructor?
//   it('Should be a proper address', async () => {
//     const { pair } = await loadFixture(fixture)
//     expect(pair.pairContractCallee.address).to.be.properAddress
//   })

//   it('Should have proper factory address', async () => {
//     const { pair } = await loadFixture(fixture)

//     const result = await pair.pairContract.factory()
//     expect(result).to.be.properAddress
//   })
// })
