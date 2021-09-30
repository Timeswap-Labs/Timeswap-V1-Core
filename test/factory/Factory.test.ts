import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';

import { pseudoRandomBigInt } from '../shared/Helper'
import { factoryInit } from '../shared/Factory';

const { solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Factory Contract', () => {
  let signers: SignerWithAddress[];
  let factory: Contract;
  const MaxUint16 = BigNumber.from(2).pow(16).sub(1);
  let fee: bigint;
  let protocol_fee: bigint;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    fee = pseudoRandomBigInt(MaxUint16);
    protocol_fee = pseudoRandomBigInt(MaxUint16);
    factory = await factoryInit(signers[10].address, fee, protocol_fee); // deploying the factory
  })

  
  it("Set Owner and accept owner from another account", async () => {
    // setting new owner and emitting event
    await expect(factory.connect(signers[10]).setOwner(signers[1].address)).to.emit(factory, 'SetOwner').withArgs(signers[1].address);
    // accepting ownership and emitting event
    await expect(factory.connect(signers[1]).acceptOwner()).to.emit(factory, 'AcceptOwner').withArgs(signers[1].address);
    const currentOwner = await factory.owner()
    const expectedOwner = signers[1].address
    expect(currentOwner).to.equal(expectedOwner);
    expect(currentOwner).to.be.equal(signers[1].address);
  });

  it("Setting New Owner from non-owner account: Reverted", async () => {
    await expect(factory.connect(signers[9]).setOwner(signers[1].address)).to.be.revertedWith("Forbidden");
  });

  it("Setting New Owner to ZeroAddress: Reverted", async () => {
    await expect(factory.connect(signers[10]).setOwner(ethers.constants.AddressZero)).to.be.revertedWith("Zero");
  });

  it("Accept owner from third account: Reverted", async () => {
    await factory.connect(signers[10]).setOwner(signers[1].address);
    await expect(factory.connect(signers[2]).acceptOwner()).to.be.revertedWith("Forbidden");
  })
  
});

describe("", async()=>{
  it("Deploying factory with zero address: Reverted", async () => {
    await expect(factoryInit(ethers.constants.AddressZero)).to.be.revertedWith('Zero');
  });
})
