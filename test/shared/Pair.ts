import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { factoryInit } from './Factory'
import { Claims, Due, State, Tokens } from './PairInterface'
import { ContractTransaction } from 'ethers'

import type { TimeswapPair as PairContract } from '../../typechain/TimeswapPair'
import type { TestToken } from '../../typechain/TestToken'

export class Pair {
  constructor(public pairContract: PairContract, public maturity: bigint) {}

  upgrade(signerWithAddress: SignerWithAddress): PairSigner {
    return new PairSigner(signerWithAddress, this)
  }

 

  async state(): Promise<State> {
    const [ asset, interest, cdp ] = await this.pairContract.constantProduct(this.maturity)
    return { asset: BigInt(asset.toString()), interest: BigInt(interest.toString()), cdp: BigInt(cdp.toString()) }
  }

  async totalLocked(): Promise<Tokens> {
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

  async totalClaims(): Promise<Claims> {
    const { bond, insurance } = await this.pairContract.totalClaims(this.maturity)
    return { bond: BigInt(bond.toString()), insurance: BigInt(insurance.toString()) }
  }

  async claimsOf(signerWithAddress: SignerWithAddress): Promise<Claims> {
    const { bond, insurance } = await this.pairContract.claimsOf(this.maturity, signerWithAddress.address)
    return { bond: BigInt(bond.toString()), insurance: BigInt(insurance.toString()) }
  }

  async duesOf(signerWithAddress: SignerWithAddress): Promise<Due[]> {
    const dues = await this.pairContract.duesOf(this.maturity, signerWithAddress.address)

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
    super(pair.pairContract, pair.maturity)
    this.signerWithAddress = signerWithAddress
  }

  async mint(xIncrease: bigint,yIncrease: bigint, zIncrease: bigint): Promise<ContractTransaction> {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .mint(
        this.maturity,
        this.signerWithAddress.address,
        this.signerWithAddress.address,
        xIncrease,
        yIncrease,
        zIncrease,
        ''
      )
    await txn.wait()
    return txn
  }

  async burn(liquidityIn: bigint) {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .burn(this.maturity, this.signerWithAddress.address, this.signerWithAddress.address, liquidityIn)
    await txn.wait()
    return txn
  }

  async lend(xIncrease: bigint, yDecrease: bigint, zDecrease: bigint): Promise<ContractTransaction> {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .lend(
        this.maturity,
        this.signerWithAddress.address,
        this.signerWithAddress.address,
        xIncrease,
        yDecrease,
        zDecrease,
        ''
      )
    await txn.wait()
    return txn
  }

  async withdraw(bond: bigint, insurance: bigint) {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .withdraw(this.maturity, this.signerWithAddress.address, this.signerWithAddress.address, {
        bond: bond,
        insurance: insurance,
      })
    await txn.wait()
    return txn
  }

  async borrow(assetOut: bigint, interestIncrease: bigint, cdpIncrease: bigint): Promise<ContractTransaction> {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .borrow(
        this.maturity,
        this.signerWithAddress.address,
        this.signerWithAddress.address,
        assetOut,
        interestIncrease,
        cdpIncrease,
        ''
      )
    await txn.wait()
    return txn
  }

  async pay(ids: bigint[], debtsIn: bigint[], collateralsOut: bigint[]): Promise<ContractTransaction> {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .pay(this.maturity, this.signerWithAddress.address, this.signerWithAddress.address, ids, debtsIn, collateralsOut, '') //FIXME
    await txn.wait()
    return txn
  }

 
}

export async function pairInit(asset: TestToken, collateral: TestToken, maturity: bigint) {
  const factory = await factoryInit()

  await factory.createPair(asset.address, collateral.address)

  const pairContractFactory = await ethers.getContractFactory('TimeswapPair')
  const pairContract = pairContractFactory.attach(
    await factory.getPair(asset.address, collateral.address)
  ) as PairContract

  return new Pair(pairContract, maturity)
}

export default { Pair, PairSigner, pairInit }
