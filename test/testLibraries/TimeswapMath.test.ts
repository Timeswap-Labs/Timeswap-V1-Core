import { BigNumberish } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { TimeswapMathTest, IPair } from '../../typechain/TimeswapMathTest'
import MintMath from '../libraries/MintMath'
import BorrowMath from '../libraries/BorrowMath'
import BurnMath from '../libraries/BurnMath'
import PayMath from '../libraries/PayMath'
import WithdrawMath from '../libraries/WithdrawMath'
import { PROTOCOL_FEE } from '../shared/Constants'
import { expect } from '../shared/Expect'
import { now } from '../shared/Helper'
import { State } from '../shared/PairInterface'

const { solidity } = waffle
chai.use(solidity)

interface Token {
    asset: bigint
    collateral: bigint
}

interface Claims {
    bondPrincipal: bigint
    bondInterest: bigint
    insurancePrincipal: bigint
    insuranceInterest: bigint
}

interface StateParams {
    reserves: Token
    totalLiquidity: bigint
    totalClaims: Claims
    totalDebtCreated: bigint
    x: bigint
    y: bigint
    z: bigint
}

interface StateTestParams {
    reserves: Token
    totalLiquidity: bigint
    totalClaims: Claims
    totalDebtCreated: bigint
    asset: bigint
    interest: bigint
    cdp: bigint
}

let state: IPair.StateStruct = {
    reserves: { asset: 0n, collateral: 0n },
    feeStored: 1n,
    totalLiquidity: 0n,
    totalClaims: { bondPrincipal: 0n, bondInterest: 0n, insuranceInterest: 0n, insurancePrincipal: 0n },
    totalDebtCreated: 0n,
    x: 100n,
    y: 10n,
    z: 1n,
}

let stateTest: State = {
    reserves: { asset: 0n, collateral: 0n },
    totalLiquidity: 0n,
    totalClaims: { bondPrincipal: 0n, bondInterest: 0n, insuranceInterest: 0n, insurancePrincipal: 0n },
    totalDebtCreated: 0n,
    asset: 100n,
    interest: 10n,
    cdp: 1n,
    feeStored: 1n
}

let maturity: BigNumberish
let assetIn: bigint = 1000n
let interestIncrease: bigint = 30n
let cdpIncrease: bigint = 2n
let signers: SignerWithAddress[];


describe("TimeswapMath", () => {
    let TimeswapMathTestContract: TimeswapMathTest;

    // beforeEach("", async () => {
    //     signers = await ethers.getSigners()
    //     maturity = (await now()) + 10000n
    //     const TimeswapMathContractFactory = await ethers.getContractFactory("TimeswapMath");
    //     const TimeswapMathContract = await TimeswapMathContractFactory.deploy();
    //     const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest',
    //         {
    //             libraries: {
    //                 TimeswapMath: TimeswapMathContract.address
    //             }
    //         }
    //     )
    //     TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
    //     await TimeswapMathTestContract.deployed()
    // })

    describe('Mint Math', () => {
        let liquidityOut: any
        let feeStoredIncrease: any
        let dueOut: any

        describe("New Liquidity", () => {
            before("", async () => {
                signers = await ethers.getSigners()
                maturity = (await now()) + 10000n
                const TimeswapMathContractFactory = await ethers.getContractFactory("TimeswapMath");
                const TimeswapMathContract = await TimeswapMathContractFactory.deploy();
                const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest',
                    {
                        libraries: {
                            TimeswapMath: TimeswapMathContract.address
                        }
                    }
                )
                TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
                await TimeswapMathTestContract.deployed();

                [liquidityOut, dueOut, feeStoredIncrease] = await TimeswapMathTestContract.mint(
                    maturity,
                    state,
                    assetIn,
                    interestIncrease,
                    cdpIncrease
                )

            })

            it('LiquidityTotal, newLiquidity', async () => {
                const liquidityOutComputed = MintMath.getLiquidity1(assetIn);
                expect(liquidityOut.eq(liquidityOutComputed)).to.be.true;
            })

            it('Debt, newLiquidity', async () => {
                const debtComputed = MintMath.getDebt(
                    maturity as bigint,
                    assetIn,
                    interestIncrease,
                    (await now())
                )
                expect(dueOut[0].eq(debtComputed)).to.true;
            })

            it('Collateral, newLiquidity', async () => {
                const collateralComputed = MintMath.getCollateral(
                    maturity as bigint,
                    assetIn,
                    interestIncrease,
                    cdpIncrease,
                    (await now())
                )
                expect(dueOut[1].eq(collateralComputed)).to.true;
            })

            it('StartBlock, newLiquidity', async () => {
                const startBlockComputed = await ethers.provider.getBlockNumber();
                expect(dueOut[2]).to.equal(startBlockComputed);
            })

            it('Fee Stored, newLiquidity', async () => {
                const liquidityOutComputed = MintMath.getLiquidity1(assetIn);

                const feeStoredComputed = MintMath.getFee(
                    stateTest,
                    liquidityOutComputed as bigint,
                )
                expect(feeStoredIncrease.eq(feeStoredComputed)).to.true;
            })
        })

        describe("Additional Liquidity", () => {
            before("", async () => {
                signers = await ethers.getSigners()
                maturity = (await now()) + 10000n
                state.totalLiquidity = 50n;
                stateTest.totalLiquidity = 50n;
                const TimeswapMathContractFactory = await ethers.getContractFactory("TimeswapMath");
                const TimeswapMathContract = await TimeswapMathContractFactory.deploy();
                const TimeswapMathTestContractFactory = await ethers.getContractFactory('TimeswapMathTest',
                    {
                        libraries: {
                            TimeswapMath: TimeswapMathContract.address
                        }
                    }
                )
                TimeswapMathTestContract = (await TimeswapMathTestContractFactory.deploy()) as TimeswapMathTest
                await TimeswapMathTestContract.deployed();

                [liquidityOut, dueOut, feeStoredIncrease] = await TimeswapMathTestContract.mint(
                    maturity,
                    state,
                    assetIn,
                    interestIncrease,
                    cdpIncrease
                )

            })

            it('LiquidityTotal, additional liquidity', async () => {
                const liquidityOutComputed = MintMath.getLiquidity2(stateTest,
                    assetIn,
                    interestIncrease,
                    cdpIncrease);
                expect(liquidityOut.eq(liquidityOutComputed)).to.be.true;
            })

            it('Debt, additional liquidity', async () => {
                const debtComputed = MintMath.getDebt(
                    maturity as bigint,
                    assetIn,
                    interestIncrease,
                    (await now())
                )
                expect(dueOut[0].eq(debtComputed)).to.true;
            })

            it('Collateral, additional liquidity', async () => {
                const collateralComputed = MintMath.getCollateral(
                    maturity as bigint,
                    assetIn,
                    interestIncrease,
                    cdpIncrease,
                    (await now())
                )
                expect(dueOut[1].eq(collateralComputed)).to.true;
            })

            it('StartBlock, additional liquidity', async () => {
                const startBlockComputed = await ethers.provider.getBlockNumber();
                expect(dueOut[2]).to.equal(startBlockComputed);
            })

            it('Fee Stored, additional liquidity', async () => {
                const liquidityOutComputed = MintMath.getLiquidity2(stateTest,
                    assetIn,
                    interestIncrease,
                    cdpIncrease);

                const feeStoredComputed = MintMath.getFee(
                    stateTest,
                    liquidityOutComputed as bigint,
                )
                expect(feeStoredIncrease.eq(feeStoredComputed)).to.true;
            })
        })




        // it('Getting LiquidityTotal for AssetIn, additional Liquidity', async () => {
        //     state.totalLiquidity = 50n;
        //     stateTest.totalLiquidity = 50n;
        //     const {
        //         liquidityOut,
        //         dueOut,
        //         feeStoredIncrease
        //     } = await TimeswapMathTestContract.mint(
        //         maturity,
        //         state,
        //         assetIn,
        //         interestIncrease,
        //         cdpIncrease
        //     )
        //     const liquidityOutComputed = MintMath.getLiquidity2(
        //         stateTest,
        //         assetIn,
        //         interestIncrease,
        //         cdpIncrease
        //     );
        //     const debtComputed = MintMath.getDebt(
        //         maturity as bigint,
        //         assetIn,
        //         interestIncrease,
        //         (await now())
        //     )
        //     const collateralComputed = MintMath.getCollateral(
        //         maturity as bigint,
        //         assetIn,
        //         interestIncrease,
        //         cdpIncrease,
        //         (await now())
        //     )
        //     const feeStoredComputed = MintMath.getFee(
        //         stateTest,
        //         liquidityOutComputed as bigint,
        //     )
        //     const startBlockComputed = await ethers.provider.getBlockNumber();
        //     expect(liquidityOut.eq(liquidityOutComputed)).to.be.true;
        //     expect(dueOut[0].eq(debtComputed)).to.true;
        //     expect(dueOut[1].eq(collateralComputed)).to.true;
        //     expect(dueOut[2]).to.equal(startBlockComputed);
        //     expect(feeStoredIncrease.eq(feeStoredComputed)).to.true;

        // })
    })

    // describe('Burn Math', () => {
    //     it('Getting LiquidityTotal for AssetIn, newLiquidity', async () => {
    //         // const fee: bigint = 2n
    //         const {
    //             liquidityOut
    //         } = await TimeswapMathTestContract.mint(
    //             maturity,
    //             state,
    //             assetIn,
    //             interestIncrease,
    //             cdpIncrease
    //         )
    //         const liquidityOutComputed = MintMath.getLiquidity1(assetIn);
    //         expect(liquidityOut.eq(liquidityOutComputed)).to.be.true;
    //     })

    //     it('Getting LiquidityTotal for AssetIn, additional Liquidity', async () => {
    //         state.totalLiquidity = 50n;
    //         const {
    //             liquidityOut
    //         } = await TimeswapMathTestContract.mint(
    //             maturity,
    //             state,
    //             assetIn,
    //             interestIncrease,
    //             cdpIncrease
    //         )
    //         const liquidityOutComputed = MintMath.getLiquidity2(
    //             stateTest,
    //             assetIn,
    //             interestIncrease,
    //             cdpIncrease
    //         );
    //         expect(liquidityOut.eq(liquidityOutComputed)).to.be.true;
    //     })
    //     // })
    // })
})


