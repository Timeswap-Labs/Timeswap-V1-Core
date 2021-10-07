import { ethers, } from 'hardhat'
import { constructorFixture, borrowFixture, mintFixture, Fixture, borrowError } from '../shared/Fixtures'
import * as TestCases from '../testCases'
import { expect } from '../shared/Expect'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'
import { Borrow, BorrowParams, MintParams } from '../testCases'
const MaxUint224 = BigNumber.from(2).pow(224).sub(1)
let signers: SignerWithAddress[];
let assetInValue: bigint = BigInt(MaxUint224.toString());
let collateralInValue: bigint = BigInt(MaxUint224.toString());

describe('Borrow', () => {
  let tests: any;

  before(async () => {
    signers = await ethers.getSigners();
    tests = await TestCases.borrow();
    console.log(tests.length);

  });

  it('', () => {
    tests.forEach((testCase: Borrow) => {

      describe("", async () => {
        let pair: any;
        let pairSim: any;

        before(async () => {
          try {
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
            const borrowParams: BorrowParams =
            {
              assetOut: testCase.borrowAssetOut,
              collateralIn: testCase.borrowCollateralIn,
              interestIncrease: testCase.borrowInterestIncrease,
              cdpIncrease: testCase.borrowCdpIncrease
            }
            let returnObj: any
            returnObj = await borrowFixture(mint, signers[0], borrowParams);
            
            if (returnObj.error==undefined) {
              pair = returnObj.pair;
              pairSim = returnObj.pairSim;
            } else {
              testCase.borrowCdpIncrease = returnObj.cdpAdjust;
              throw Error(returnObj.error)
            }
          } catch (error) {
            describe("Testing for Failure Cases", async () => {
              before(async () => {
                const constructor = await constructorFixture(assetInValue, collateralInValue, testCase.maturity);
                const mintParameters: MintParams = {
                  assetIn: testCase.assetIn,
                  collateralIn: testCase.collateralIn,
                  interestIncrease: testCase.interestIncrease,
                  cdpIncrease: testCase.cdpIncrease,
                  maturity: testCase.maturity,
                  currentTimeStamp: testCase.currentTimeStamp
                };
                const returnObj = await mintFixture(constructor, signers[0], mintParameters);
                pair = returnObj.pair;
                pairSim = returnObj.pairSim;
              });
              it("Lend Tx should fail", async () => {
                const borrowParams: BorrowParams =
                {
                  assetOut: testCase.borrowAssetOut,
                  collateralIn: testCase.borrowCollateralIn,
                  interestIncrease: testCase.borrowInterestIncrease,
                  cdpIncrease: testCase.borrowCdpIncrease
                }
                // await pair.pairContractCallee
                //   .connect(signers[0])
                //   .borrow(pair.maturity, signers[0].address, signers[0].address, borrowParams.assetOut, borrowParams.interestIncrease, borrowParams.cdpIncrease)
                await expect(pair.pairContractCallee
                  .connect(signers[0])
                  .borrow(pair.maturity, signers[0].address, signers[0].address, borrowParams.assetOut, borrowParams.interestIncrease, borrowParams.cdpIncrease)).to.be.reverted;
              });
            })
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


