import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
import { constructorFixture, Fixture, lendFixture, mintFixture } from '../shared/Fixtures'
import * as TestCases from '../testCases'
import { expect } from '../shared/Expect'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from '@ethersproject/bignumber'

const { loadFixture, solidity } = waffle

const MaxUint224 = BigNumber.from(2).pow(224).sub(1)
let signers: SignerWithAddress[];

describe('Lend', () => {
  let assetInValue: bigint = BigInt(MaxUint224.toString()); // creating ERC20 with this number
  let collateralInValue: bigint = BigInt(MaxUint224.toString());
  let tests: any;

  before(async () => {
    tests = await TestCases.lend();
    console.log(`Success Length ${tests.Success.length}`);
    console.log(`Failure Length ${tests.Failure.length}`); // TODO: this consists of cases for which the mint will fail; it makes no sense. hence, need to update this to only include those cases for which the mint will work but only the lending will fail
  });

  it('', async () => {
    tests.Success.forEach((test: any, idx: number) => {
      let pair: any;
      let pairSim: any;
      const { mintParams, lendParams } = test;

      describe(`Success case ${idx + 1}`, () => {
        async function fixture(): Promise<Fixture> {
          const constructor = await constructorFixture(assetInValue, collateralInValue, mintParams.maturity);
          const mint = await mintFixture(constructor, signers[0], mintParams);
          return mint;
        }

        async function fixtureSuccess(): Promise<Fixture | undefined>  {
          let lend: any;
          const mint = await loadFixture(fixture);
          try {
            lend = await lendFixture(mint, signers[0], lendParams);
            return lend;
          } catch (error) {
            tests.Failure.push(test);
            throw Error;
          }
        }

        before(async () => {
          signers = await ethers.getSigners();
          try {
            const returnObj = await loadFixture(fixtureSuccess);
            if (returnObj != undefined) {
              pair = returnObj.pair;
              pairSim = returnObj.pairSim;
            }
          } catch (error) {
            console.log("THERE WAS AN ERROR IN THE LOADFIXTURE(FIXTURESUCCESS");
            throw Error;
          }
        })




        it('Should have correct total reserves', async () => {
          const reserves = await pair.totalReserves()
          const reservesSim = pairSim.getPool(mintParams.maturity).state.reserves

          expect(reserves.asset).to.equalBigInt(reservesSim.asset)
          expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
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
        // })
      })
    })

    tests.Failure.forEach((test: any, idx: number) => {
      const { mintParams, lendParams } = test;
      describe(`Failure case ${idx + 1}`, () => {
        async function fixture(): Promise<Fixture> {
          const constructor = await constructorFixture(assetInValue, collateralInValue, mintParams.maturity);
          const mint = await mintFixture(constructor, signers[0], mintParams);
          console.log("miniting done");
          return mint;
        }

        before(async () => {
          signers = await ethers.getSigners();
        })

        it('Should fail', async () => {
          const mint = await loadFixture(fixture);
          try {
            await lendFixture(mint, signers[0], lendParams);
          } catch (error) {
            console.log(error);
          }

        })
      })
    })
  })
})
