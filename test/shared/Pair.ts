import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber, ContractTransaction } from 'ethers'
import { ethers } from 'hardhat'
import { Address } from 'hardhat-deploy/dist/types'
import type { TestToken } from '../../typechain/TestToken'
import type { TimeswapFactory as Factory } from '../../typechain/TimeswapFactory'
import type { TimeswapPair as PairContract } from '../../typechain/TimeswapPair'
import type { TimeswapPairCallee as PairContractCallee } from '../../typechain/TimeswapPairCallee'
import { factoryInit } from './Factory'
import { ConstantProduct, Due, Tokens, TotalClaims } from './PairInterface'
import { now } from '../shared/Helper'

export class Pair {
  constructor(
    public pairContractCallee: PairContractCallee,
    public pairContract: PairContract,
    public factoryContract: Factory,
    public maturity: bigint
  ) {}

  upgrade(signerWithAddress: SignerWithAddress): PairSigner {
    return new PairSigner(signerWithAddress, this)
  }

  async factory(): Promise<Address> {
    return await this.pairContract.factory()
  }

  async feeStored(): Promise<BigNumber> {
    return await this.pairContract.feeStored(this.maturity)
  }

  async state(): Promise<ConstantProduct> {
    const [asset, interest, cdp] = await this.pairContract.constantProduct(this.maturity)
    return { asset: BigInt(asset.toString()), interest: BigInt(interest.toString()), cdp: BigInt(cdp.toString()) }
  }

  async totalReserves(): Promise<Tokens> {
    const { asset, collateral } = await this.pairContract.totalReserves(this.maturity)
    return { asset: BigInt(asset.toString()), collateral: BigInt(collateral.toString()) }
  }

  async totalLiquidity(): Promise<bigint> {
    const resultBN = await this.pairContract.totalLiquidity(this.maturity)
    const result = BigInt(resultBN.toString())

    return result
  }

  async liquidityOf(signerWithAddress: SignerWithAddress): Promise<bigint> {
    const resultBN = await this.pairContract.liquidityOf(this.maturity, signerWithAddress.address)
    const result = BigInt(resultBN.toString())

    return result
  }

  async totalClaims(): Promise<TotalClaims> {
    const { bondPrincipal, bondInterest, insurancePrincipal, insuranceInterest } = await this.pairContract.totalClaims(
      this.maturity
    )
    return {
      bondPrincipal: BigInt(bondPrincipal.toString()),
      bondInterest: BigInt(bondInterest.toString()),
      insurancePrincipal: BigInt(insurancePrincipal.toString()),
      insuranceInterest: BigInt(insuranceInterest.toString()),
    }
  }

  async claimsOf(signerWithAddress: SignerWithAddress): Promise<TotalClaims> {
    const { bondPrincipal, bondInterest, insurancePrincipal, insuranceInterest } = await this.pairContract.claimsOf(
      this.maturity,
      signerWithAddress.address
    )
    return {
      bondPrincipal: BigInt(bondPrincipal.toString()),
      bondInterest: BigInt(bondInterest.toString()),
      insurancePrincipal: BigInt(insurancePrincipal.toString()),
      insuranceInterest: BigInt(insuranceInterest.toString()),
    }
  }

  async totalDebtCreated(): Promise<bigint> {
    const totalDebtCreated = await this.pairContract.totalDebtCreated(this.maturity)
    return BigInt(totalDebtCreated.toString())
  }
  async dueOf(
    id: bigint,
    maturity: bigint = this.maturity,
    address: Address = this.pairContractCallee.address
  ): Promise<Due[]> {
    const dues = [await this.pairContract.dueOf(maturity, address, id)]
    return dues.map((value) => {
      return {
        debt: BigInt(value.debt.toString()),
        collateral: BigInt(value.collateral.toString()),
        startBlock: BigInt(value.startBlock),
      }
    })
  }
}

export class PairSigner extends Pair {
  signerWithAddress: SignerWithAddress

  constructor(signerWithAddress: SignerWithAddress, pair: Pair) {
    super(pair.pairContractCallee, pair.pairContract, pair.factoryContract, pair.maturity)
    this.signerWithAddress = signerWithAddress
  }

  async mint(xIncrease: bigint, yIncrease: bigint, zIncrease: bigint): Promise<ContractTransaction> {
    const txn = await this.pairContractCallee
      .connect(this.signerWithAddress)
      .mint(this.maturity, this.signerWithAddress.address, xIncrease, yIncrease, zIncrease)
    await txn.wait()
    return txn
  }

  async burn(liquidityIn: bigint) {
    const txn = await this.pairContract.connect(this.signerWithAddress).burn({
      maturity: this.maturity,
      assetTo: this.signerWithAddress.address,
      collateralTo: this.signerWithAddress.address,
      liquidityIn: liquidityIn,
    })
    await txn.wait()
    return txn
  }

  async lend(xIncrease: bigint, yDecrease: bigint, zDecrease: bigint): Promise<ContractTransaction> {
    const txn = await this.pairContractCallee
      .connect(this.signerWithAddress)
      .lend(
        this.maturity,
        this.signerWithAddress.address,
        this.signerWithAddress.address,
        xIncrease,
        yDecrease,
        zDecrease
      )
    await txn.wait()
    return txn
  }

  async withdraw(bondPrincipal: bigint, bondInterest: bigint, insurancePrincipal: bigint, insuranceInterest: bigint) {
    const txn = await this.pairContract.connect(this.signerWithAddress).withdraw({
      maturity: this.maturity,
      assetTo: this.signerWithAddress.address,
      collateralTo: this.signerWithAddress.address,
      claimsIn: {
        bondPrincipal: bondPrincipal,
        bondInterest: bondInterest,
        insurancePrincipal: insurancePrincipal,
        insuranceInterest: insuranceInterest,
      },
    })
    await txn.wait()
    return txn
  }

  async borrow(
    assetOut: bigint,
    interestIncrease: bigint,
    cdpIncrease: bigint,
    owner: boolean
  ): Promise<ContractTransaction> {
    let dueTo = this.pairContractCallee.address
    if (owner) {
      dueTo = this.signerWithAddress.address
    }
    const txn = await this.pairContractCallee
      .connect(this.signerWithAddress)
      .borrow(this.maturity, this.signerWithAddress.address, dueTo, assetOut, interestIncrease, cdpIncrease)
    await txn.wait()
    return txn
  }

  async pay(ids: bigint[], debtsIn: bigint[], collateralsOut: bigint[]): Promise<ContractTransaction> {
    let owner = this.pairContractCallee.address
    const txn = await this.pairContractCallee
      .connect(this.signerWithAddress)
      .pay(this.maturity, this.signerWithAddress.address, owner, ids, debtsIn, collateralsOut)
    await txn.wait()
    return txn
  }
}

export async function pairInit(asset: TestToken, collateral: TestToken, maturity: bigint) {
  const pairContractCalleeFactory = await ethers.getContractFactory('TimeswapPairCallee')
  const timeswapMathLibraryFactory = await ethers.getContractFactory('TimeswapMath')
  const timeswapMathLibraryContract = timeswapMathLibraryFactory.deploy()
  const timeswapMathAddress = (await timeswapMathLibraryContract).address
  const pairContractFactory = await ethers.getContractFactory('TimeswapPair', {
    libraries: {
      TimeswapMath: timeswapMathAddress,
    },
  })
  const factory = await factoryInit(undefined, undefined, undefined, timeswapMathAddress)
  await factory.createPair(asset.address, collateral.address)

  const pairContract = pairContractFactory.attach(
    await factory.getPair(asset.address, collateral.address)
  ) as PairContract

  const pairContractCallee = (await pairContractCalleeFactory.deploy(pairContract.address)) as PairContractCallee

  return new Pair(pairContractCallee, pairContract, factory, maturity)
}

export default { Pair, PairSigner, pairInit }
