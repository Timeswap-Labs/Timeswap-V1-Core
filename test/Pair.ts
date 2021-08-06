import { Provider } from '@ethersproject/providers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { factoryInit } from './Factory'

import type { Pair as PairContract } from '../typechain/Pair'
import type { TestToken } from '../typechain/TestToken'

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

  async mint(interestIncrease: number, cdpIncrease: number) {
    await this.pairContract.mint(
      this.maturity,
      this.signerWithAddress.address,
      this.signerWithAddress.address,
      interestIncrease,
      cdpIncrease
    )
  }
}

export async function pairInit(provider: Provider, asset: TestToken, collateral: TestToken, maturity: bigint) {
  const factory = await factoryInit()

  const pairContractFactory = await ethers.getContractFactory('Pair')
  const pairContract = pairContractFactory.attach(
    await factory.getPair(asset.address, collateral.address)
  ) as PairContract

  return new Pair(pairContract, maturity)
}

export default { Pair, PairSigner, pairInit }
