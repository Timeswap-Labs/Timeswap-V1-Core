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
    tests = [
      {
        lendAssetIn: 237610557474961966470000000000n,
        lendInterestDecrease: 1036459088346607068400000000000n,
        lendCdpDecrease: 589282358457526935070000000000n,
        assetIn: 112472928633246085270000000000000n,
        collateralIn: 749283148479034033240000000000000n,
        interestIncrease: 466961018103522903540000000000000n,
        cdpIncrease: 1359799416146396658900000000000000n,
        maturity: 1747256449n,
        currentTimeStamp: 1633347547n
      }
    ]
    console.log("tests.length from line 28 in lend.tests", tests.length);
  });

  it('', () => {
    tests.forEach((testCase: Lend) => {
      console.log(tests);
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

          try {
            const returnObj = await loadFixture(fixtureSuccess);
            console.log("DID NOT GET AND ERROR");
            pair = returnObj.pair;
            pairSim = returnObj.pairSim;
            console.log("GOT THE PAIR AND PAIRSIM AFTER THE LENDFIXTURE");
            
            describe("Success Test Cases", async () => {
              it('Should have correct total reserves', async () => {
                console.log("CHECKING THIS");
                const reserves = await pair.totalReserves()
                const reservesSim = pairSim.getPool(testCase.maturity).state.reserves
                expect(reserves.asset).to.equalBigInt(reservesSim.asset)
                expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
              })

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
            })


          } catch (errorMessage) {
            console.log(errorMessage);

            describe("", async () => {
              it("Lend Tx should fail", async () => {
                console.log("EXPECTING A FAILED TX");
                const mint = await loadFixture(fixture);
                const lendParams: LendParams =
                {
                  assetIn: testCase.lendAssetIn,
                  interestDecrease: testCase.lendInterestDecrease,
                  cdpDecrease: testCase.lendCdpDecrease
                }
                const { pair } = mint;
                await expect(pair.pairContractCallee
                  .connect(signers[0])
                  .lend(pair.maturity, signers[0].address, signers[0].address, lendParams.assetIn, lendParams.interestDecrease, lendParams.cdpDecrease, tests.currentTimeStamp)).to.be.reverted
                console.log("FAILED TX DONE");
              })
            })
          }
        })
      })
    });
  })
})