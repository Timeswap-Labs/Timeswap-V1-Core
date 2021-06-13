const { expect } = require("chai");
const { stripZeros } = require("ethers/lib/utils");
const { web3 } = require("hardhat");
const { now } = require("./Helper");

const TimeswapFactory = artifacts.require("TimeswapFactory")
const TimeswapPool = artifacts.require("TimeswapPool")
const Insurance = artifacts.require("Insurance")
const Bond = artifacts.require("Bond")
const CollateralizedDebt = artifacts.require("CollateralizedDebt")
const TestToken = artifacts.require("TestToken")

const transactionFee = 100n
const protocolFee = 100n

const duration = 86400n

const checkBigIntEquality = (result, expected) => {
    expect(String(result)).to.equal(String(expected))
}

let accounts
let timeswapFactory
let timeswapPool
let insurance
let bond
let collateralizedDebt

let feeTo
let feeToSetter

const deployTry = async (desiredTransactionFee, desiredProtocolFee) => {
    accounts = await web3.eth.getAccounts()

    timeswapPool = await TimeswapPool.new()
    bond = await Bond.new()
    insurance = await Insurance.new()
    collateralizedDebt = await CollateralizedDebt.new()

    feeTo = accounts[1]
    feeToSetter = accounts[2]

    timeswapFactory = await TimeswapFactory.new(
        feeTo,
        feeToSetter,
        timeswapPool.address,
        bond.address,
        insurance.address,
        collateralizedDebt.address,
        desiredTransactionFee,
        desiredProtocolFee
    )
}

const deploy = async () => await deployTry(transactionFee, protocolFee)

describe("constructor", () => {
    describe("sucess case", () => {
        before(async () => {
            await deploy()
        })

        it("Should be a proper address", async () => {
            expect(timeswapFactory.address).to.be.properAddress
        })

        it("Should have the correct feeTo", async () => {
            const result = await timeswapFactory.feeTo()

            expect(result).to.equal(feeTo)
        })

        it("Should have the correct feeToSetter", async () => {
            const result = await timeswapFactory.feeToSetter()

            expect(result).to.equal(feeToSetter)
        })

        it("Should have the correct timeswap pool", async () => {
            const result = await timeswapFactory.pool()

            expect(result).to.equal(timeswapPool.address)
        })

        it("Should have the correct bond", async () => {
            const result = await timeswapFactory.bond()

            expect(result).to.equal(bond.address)
        })

        it("Should have the correct insurance", async () => {
            const result = await timeswapFactory.insurance()

            expect(result).to.equal(insurance.address)
        })

        it("Should have the correct collateralizedDebt", async () => {
            const result = await timeswapFactory.collateralizedDebt()

            expect(result).to.equal(collateralizedDebt.address)
        })

        it("Should have the correct transaction fee", async () => {
            const resultHex = await timeswapFactory.transactionFee()
            const result = resultHex

            checkBigIntEquality(result, transactionFee)
        })

        it("Should have the correct protocol fee", async () => {
            const resultHex = await timeswapFactory.protocolFee()
            const result = resultHex

            checkBigIntEquality(result, protocolFee)
        })
    })

    describe("fail case", () => {
        it("Should revert if incorrect transaction fee", async () => {
            const wrongTransactionFee = 10000

            await expect(deployTry(wrongTransactionFee, protocolFee)).to.be.reverted
        })

        it("Should revert if incorrect protocol fee", async () => {
            const wrongProtocolFee = 10000

            await expect(deployTry(transactionFee, wrongProtocolFee)).to.be.reverted
        })
    })
})

describe("createPool", () => {
    const decimals1 = 8
    const decimals2 = 18

    let testToken1
    let testToken2

    let maturity

    before(async () => {
        await deploy()

        testToken1 = await TestToken.new(decimals1)
        testToken2 = await TestToken.new(decimals2)

        maturity = await now() + duration

        await timeswapFactory.createPool(testToken1.address, testToken2.address, maturity)
    })

    describe("success case", () => {
        it("Should create a pool", async () => {
            const result = await timeswapFactory.getPool(testToken1.address, testToken2.address, maturity)

            expect(result).to.be.properAddress
        })
    })

    describe("fail case", () => {
        it("Should revert if pool already exist", async () => {
            await expect(timeswapFactory.createPool(testToken1.address, testToken2.address, maturity)).to.be.reverted
        })
    })
})

describe("setFeeTo", () => {
    let newFeeTo

    beforeEach(async () => {
        await deploy()

        newFeeTo = accounts[3]
    })

    describe("success case", () => {
        it("Should change feeTo by feeToSetter", async () => {
            await timeswapFactory.setFeeTo(newFeeTo, { from: feeToSetter })

            const result = await timeswapFactory.feeTo()

            expect(result).to.equal(newFeeTo)
        })
    })

    describe("fail case", () => {
        it("Should revert if not changed by feeToSetter", async () => {
            await expect(timeswapFactory.setFeeTo(newFeeTo)).to.be.reverted
        })
    })
})



describe("setFeeToSetter", () => {
    let newFeeToSetter

    beforeEach(async () => {
        await deploy()

        newFeeToSetter = accounts[3]
    })

    describe("success case", () => {
        it("Should change feeToSetter by feeToSetter", async () => {
            await timeswapFactory.setFeeToSetter(newFeeToSetter, { from: feeToSetter })

            const result = await timeswapFactory.feeToSetter()

            expect(result).to.equal(newFeeToSetter)
        })
    })

    describe("fail case", () => {
        it("Should revert if not changed by feeToSetter", async () => {
            await expect(timeswapFactory.setFeeToSetter(newFeeToSetter)).to.be.reverted
        })
    })

})