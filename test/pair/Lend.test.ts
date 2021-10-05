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

  before(async () => {
    signers = await ethers.getSigners();
    tests = await TestCases.lend();
    console.log("tests.length from line 28 in lend.tests", tests.length);
  });

  it('', () => {
    tests.forEach((testCase: Lend) => {

      describe("", async () => {
        let pair: any;
        let pairSim: any;
        let mint: any;

        before(async() => {
          const constructor = await constructorFixture(assetInValue, collateralInValue, testCase.maturity);
          const mintParameters: MintParams = {
            assetIn: testCase.assetIn,
            collateralIn: testCase.collateralIn,
            interestIncrease: testCase.interestIncrease,
            cdpIncrease: testCase.cdpIncrease,
            maturity: testCase.maturity,
            currentTimeStamp: testCase.currentTimeStamp
          };
          mint = await mintFixture(constructor, signers[0], mintParameters);
        })

        beforeEach(async () => {
          try {
            const lendParams: LendParams =
            {
              assetIn: testCase.lendAssetIn,
              interestDecrease: testCase.lendInterestDecrease,
              cdpDecrease: testCase.lendCdpDecrease
            }
            const returnObj = await lendFixture(mint, signers[0], lendParams);
            pair = returnObj.pair;
            pairSim = returnObj.pairSim;
          } catch (error) {
            describe("Testing for Failure Cases", async () => {
              pair = mint.pair;
              pairSim = mint.pairSim;
              
              it("Lend Tx should fail", async () => {
                const lendParams: LendParams =
                {
                  assetIn: testCase.lendAssetIn,
                  interestDecrease: testCase.lendInterestDecrease,
                  cdpDecrease: testCase.lendCdpDecrease
                }
                await expect(pair.pairContractCallee
                  .connect(signers[0])
                  .lend(pair.maturity, signers[0].address, signers[0].address, lendParams.assetIn, lendParams.interestDecrease, lendParams.cdpDecrease)).to.be.reverted;
                
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
          } else {
          }
        })

      })
    })
  })
});


 // it('Should have correct state', async () => {
          //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

          //   const state = await pair.state()
          //   const stateSim = pairSim.getPool(testCase.maturity).state
          //   expect(state.asset).to.equalBigInt(stateSim.asset)
          //   expect(state.interest).to.equalBigInt(stateSim.interest)
          //   expect(state.cdp).to.equalBigInt(stateSim.cdp)
          // })

          // it('Should have correct total liquidity', async () => {
          //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

          //   const liquidity = await pair.totalLiquidity()
          //   const liquiditySim = pairSim.getPool(testCase.maturity).state.totalLiquidity

          //   expect(liquidity).to.equalBigInt(liquiditySim)
          // })

          // it('Should have correct liquidity of', async () => {
          //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
          //   const signers = await ethers.getSigners()

          //   const liquidityOf = await pair.liquidityOf(signers[0])
          //   const liquidityOfSim = pairSim.getLiquidity(pairSim.getPool(testCase.maturity), signers[0].address)

          //   expect(liquidityOf).to.equalBigInt(liquidityOfSim)
          // })

          // it('Should have correct total debt', async () => {
          //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
          //   const signers = await ethers.getSigners()

          //   const totalDebtCreated = await pair.totalDebtCreated()
          //   const totalDebtCreatedSim = pairSim.getPool(testCase.maturity).state.totalDebtCreated
          //   expect(totalDebtCreated).to.equalBigInt(totalDebtCreatedSim);
          // })

          // it('Should have correct total claims', async () => {
          //   const { pair, pairSim } = await loadFixture(fixtureSuccess)

          //   const claims = await pair.totalClaims()
          //   const claimsSim = pairSim.getPool(testCase.maturity).state.totalClaims

          //   expect(claims.bond).to.equalBigInt(claimsSim.bond)
          //   expect(claims.insurance).to.equalBigInt(claimsSim.insurance)
          // })

          // it('Should have correct claims of', async () => {
          //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
          //   const signers = await ethers.getSigners()

          //   const claimsOf = await pair.claimsOf(signers[0])
          //   const claimsOfSim = pairSim.getClaims(pairSim.getPool(testCase.maturity), signers[0].address)

          //   expect(claimsOf.bond).to.equalBigInt(claimsOfSim.bond)
          //   expect(claimsOf.insurance).to.equalBigInt(claimsOfSim.insurance)
          // })

          // it('Should have correct dues of', async () => {
          //   const { pair, pairSim } = await loadFixture(fixtureSuccess)
          //   const signers = await ethers.getSigners()

          //   const duesOf = await pair.duesOf()
          //   const duesOfSim = pairSim.getDues(pairSim.getPool(testCase.maturity), signers[0].address).due

          //   expect(duesOf.length).to.equal(duesOfSim.length)

          //   for (let i = 0; i < duesOf.length; i++) {
          //     expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
          //     expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
          //     expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
          //   }
          // })