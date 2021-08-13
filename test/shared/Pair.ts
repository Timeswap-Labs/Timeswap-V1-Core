import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { factoryInit } from './Factory'

import type { Pair as PairContract } from '../../typechain/Pair'
import type { TestToken } from '../../typechain/TestToken'

export class Pair {
  constructor(public pairContract: PairContract, public maturity: bigint) {}

  upgrade(signerWithAddress: SignerWithAddress): PairSigner {
    return new PairSigner(signerWithAddress, this)
  }

  async totalLiquidity(): Promise<bigint> {
    const resultBN = await this.pairContract.totalLiquidity(this.maturity)
    const result = BigInt(resultBN.toString())

    return result
  }
}

export class PairSigner extends Pair {
  signerWithAddress: SignerWithAddress

  constructor(signerWithAddress: SignerWithAddress, pair: Pair) {
    super(pair.pairContract, pair.maturity)
    this.signerWithAddress = signerWithAddress
  }

  async mint(interestIncrease: bigint, cdpIncrease: bigint) {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .mint(
        this.maturity,
        this.signerWithAddress.address,
        this.signerWithAddress.address,
        interestIncrease,
        cdpIncrease
      )
    await txn.wait()
    return txn
  }

  async burn(liquidityIn: bigint) {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .burn(this.maturity, this.signerWithAddress.address, this.signerWithAddress.address, liquidityIn)
    await txn.wait()
  }

  async lend(interestDecrease: bigint, cdpDecrease: bigint) {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .lend(
        this.maturity,
        this.signerWithAddress.address,
        this.signerWithAddress.address,
        interestDecrease,
        cdpDecrease
      )
    await txn.wait()
  }

  async withdraw(bond: bigint, insurance: bigint) {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .withdraw(this.maturity, this.signerWithAddress.address, this.signerWithAddress.address, {
        bond: bond,
        insurance: insurance,
      })
    await txn.wait()
  }

  async borrow(assetOut: bigint, interestIncrease: bigint, cdpIncrease: bigint) {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .borrow(
        this.maturity,
        this.signerWithAddress.address,
        this.signerWithAddress.address,
        assetOut,
        interestIncrease,
        cdpIncrease
      )
    await txn.wait()
  }

  async pay(ids: bigint[], assetsPay: bigint[]) {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .pay(this.maturity, this.signerWithAddress.address, this.signerWithAddress.address, ids, assetsPay, [0n]) //FIXME
    await txn.wait()
  }

  async skim() {
    const txn = await this.pairContract
      .connect(this.signerWithAddress)
      .skim(this.signerWithAddress.address, this.signerWithAddress.address)
    await txn.wait()
  }
}

export async function pairInit(asset: TestToken, collateral: TestToken, maturity: bigint) {
  const factory = await factoryInit()

  await factory.createPair(asset.address, collateral.address)

  const pairContractFactory = await ethers.getContractFactory('Pair')
  const pairContract = pairContractFactory.attach(
    await factory.getPair(asset.address, collateral.address)
  ) as PairContract

  return new Pair(pairContract, maturity)
}

export default { Pair, PairSigner, pairInit }
