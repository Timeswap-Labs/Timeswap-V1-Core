import chai from 'chai'
import { ethers, waffle } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from '@ethersproject/contracts';

import { now } from '../shared/Helper'
import { factoryInit } from '../shared/Factory';
import { testTokenNew } from '../shared/TestToken';
import { IERC20 } from "../../typechain/IERC20";
import type { TimeswapPair } from '../../typechain/TimeswapPair'
import { IFactory } from "../../typechain/IFactory";
import { constructorFixture, Fixture } from '../shared/Fixtures'
import { Address } from 'hardhat-deploy/dist/types';
import Constants from '../shared/Constants';

const { loadFixture, solidity } = waffle
chai.use(solidity)
const { expect } = chai

describe('Deploying Pair Contract', () => {
  let signers: SignerWithAddress[];
  let factory: IFactory;
  let assetToken: IERC20;
  let collateralToken: IERC20;
  let assetValue: bigint = 10000n;
  let collateralValue: bigint = assetValue;
  let maturity: bigint;
  let pairContractAddress: Address;

  (async ()=> {
    maturity = await now() + 31536000n
  })();

  beforeEach(async () => {
    signers = await ethers.getSigners();
    factory = await factoryInit(signers[0].address) as IFactory;
    assetToken = await testTokenNew('Ether', 'WETH', assetValue);
    collateralToken = await testTokenNew('Matic', 'MATIC', collateralValue);
  })

  it('Creat pair deploys a pair contract', async () => {
    pairContractAddress = await factory.callStatic.createPair(assetToken.address, collateralToken.address);
    expect(pairContractAddress).to.be.properAddress;
    await expect(await factory.createPair(assetToken.address, collateralToken.address)).to.emit(factory, 'CreatePair').withArgs(assetToken.address, collateralToken.address, pairContractAddress);
    const pairContractFactory = await ethers.getContractFactory('TimeswapPair');
    const pairContract = pairContractFactory.attach(pairContractAddress) as TimeswapPair;
    expect(await pairContract.factory()).to.be.equal(factory.address);
    expect(await pairContract.asset()).to.be.equal(assetToken.address);
    expect(await pairContract.collateral()).to.be.equal(collateralToken.address);
    expect((await pairContract.fee()).toString()).to.be.equal((Constants.FEE).toString());
    expect((await pairContract.protocolFee()).toString()).to.be.equal((Constants.PROTOCOL_FEE).toString());
  })

  it('Create pair with same collateral and asset address: Reverted', async () => {
    await expect(factory.createPair(assetToken.address, assetToken.address)).to.be.revertedWith("Identical");
  })

  it('Create pair with same collateral or asset as zero address: Reverted', async () => {
    await expect(factory.createPair(assetToken.address, ethers.constants.AddressZero)).to.be.revertedWith("Zero");
    await expect(factory.createPair(ethers.constants.AddressZero, collateralToken.address)).to.be.revertedWith("Zero");
  })

  it('Create pair twice: Reverted', async () => {
    await factory.createPair(assetToken.address, collateralToken.address);
    await expect(factory.createPair(assetToken.address, collateralToken.address)).to.be.revertedWith("Exist");
  })
})
