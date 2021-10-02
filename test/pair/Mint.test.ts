import { Decimal } from 'decimal.js'
import { ethers, waffle } from 'hardhat'
import { now, pseudoRandomBigUint, pseudoRandomBigUint256 } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as TestCases from '../testCases'
import { constructorFixture, Fixture, mintFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
import { MintParams } from '../testCases'

Decimal.config({ toExpNeg: 0, toExpPos: 500 })

const { loadFixture } = waffle

const MaxUint224 = BigNumber.from(2).pow(224).sub(1)
let signers: SignerWithAddress[];


describe('Mint', () => {
  let assetInValue: bigint = BigInt(MaxUint224.toString()); // creating ERC20 with this number
  let collateralInValue: bigint = BigInt(MaxUint224.toString());
  let tests: any;

  before(async () => {
    tests = await TestCases.mint();
  });

  it('', async () => {
    tests.Success.forEach((mintParams: MintParams, idx: number) => {
      describe(`Success case ${idx + 1}`, () => {
        async function fixture(): Promise<Fixture> {
          const constructor = await constructorFixture(assetInValue, collateralInValue, mintParams.maturity)
          return constructor
        }

        async function fixtureSuccess(): Promise<Fixture> {
          signers = await ethers.getSigners();
          const constructor = await loadFixture(fixture)
          const mint = await mintFixture(constructor, signers[0], mintParams);
          return mint;
        }

        it('Should have correct total reserves', async () => {
          const { pair, pairSim } = await loadFixture(fixtureSuccess)

          const reserves = await pair.totalReserves()
          const reservesSim = pairSim.getPool(mintParams.maturity).state.reserves

          expect(reserves.asset).to.equalBigInt(reservesSim.asset)
          expect(reserves.collateral).to.equalBigInt(reservesSim.collateral)
        })

        it('Should have correct state', async () => {
          const { pair, pairSim } = await loadFixture(fixtureSuccess)

          const state = await pair.state()
          const stateSim = pairSim.getPool(mintParams.maturity).state

          expect(state.asset).to.equalBigInt(stateSim.asset)
          expect(state.interest).to.equalBigInt(stateSim.interest)
          expect(state.cdp).to.equalBigInt(stateSim.cdp)
        })

        it('Should have correct total liquidity', async () => {
          const { pair, pairSim } = await loadFixture(fixtureSuccess)

          const liquidity = await pair.totalLiquidity()
          const liquiditySim = pairSim.getPool(mintParams.maturity).state.totalLiquidity

          expect(liquidity).to.equalBigInt(liquiditySim)
        })

        it('Should have correct liquidity of', async () => {
          const { pair, pairSim } = await loadFixture(fixtureSuccess)
          const signers = await ethers.getSigners()

          const liquidityOf = await pair.liquidityOf(signers[0])
          const liquidityOfSim = pairSim.getLiquidity(pairSim.getPool(mintParams.maturity), signers[0].address)

          expect(liquidityOf).to.equalBigInt(liquidityOfSim)
        })
        it('Should have correct total debt', async () => {
          const { pair, pairSim } = await loadFixture(fixtureSuccess)
          const signers = await ethers.getSigners()

          const totalDebtCreated = await pair.totalDebtCreated()
          const totalDebtCreatedSim = pairSim.getPool(mintParams.maturity).state.totalDebtCreated

          expect(totalDebtCreated).to.equalBigInt(totalDebtCreatedSim);
        })

        it('Should have correct total claims', async () => {
          const { pair, pairSim } = await loadFixture(fixtureSuccess)

          const claims = await pair.totalClaims()
          const claimsSim = pairSim.getPool(mintParams.maturity).state.totalClaims

          expect(claims.bond).to.equalBigInt(claimsSim.bond)
          expect(claims.insurance).to.equalBigInt(claimsSim.insurance)
        })

        it('Should have correct claims of', async () => {
          const { pair, pairSim } = await loadFixture(fixtureSuccess)
          const signers = await ethers.getSigners()

          const claimsOf = await pair.claimsOf(signers[0])
          const claimsOfSim = pairSim.getClaims(pairSim.getPool(mintParams.maturity), signers[0].address)

          expect(claimsOf.bond).to.equalBigInt(claimsOfSim.bond)
          expect(claimsOf.insurance).to.equalBigInt(claimsOfSim.insurance)
        })

        it('Should have correct dues of', async () => {
          const { pair, pairSim } = await loadFixture(fixtureSuccess)
          const signers = await ethers.getSigners()

          const duesOf = await pair.duesOf()
          const duesOfSim = pairSim.getDues(pairSim.getPool(mintParams.maturity), signers[0].address).due

          expect(duesOf.length).to.equal(duesOfSim.length)

          for (let i = 0; i < duesOf.length; i++) {
            expect(duesOf[i].collateral).to.equalBigInt(duesOfSim[i].collateral)
            expect(duesOf[i].debt).to.equalBigInt(duesOfSim[i].debt)
            expect(duesOf[i].startBlock).to.equalBigInt(duesOfSim[i].startBlock)
          }
        })
      })
    })

    tests.Failure.forEach((mintParams: MintParams, idx: number) => {
      describe(`Failure case ${idx + 1}`, () => {
        it('Should fail', async () => {
          async function fixture(): Promise<Fixture> {
            const constructor = await constructorFixture(assetInValue, collateralInValue, mintParams.maturity)
            return constructor
          }
          const { pair } = await loadFixture(fixture)
          await expect(
            pair.pairContractCallee
              .connect(signers[0])
              .mint(
                pair.maturity,
                signers[0].address,
                mintParams.assetIn,
                mintParams.interestIncrease,
                mintParams.cdpIncrease
              )
          ).to.be.reverted;
        })
      })
    })
  })
})


