import MintMath from '../libraries/MintMath'
import BurnMath from '../libraries/BurnMath'
import LendMath from '../libraries/LendMath'
import WithdrawMath from '../libraries/WithdrawMath'
import BorrowMath from '../libraries/BorrowMath'
import PayMath from '../libraries/PayMath'
import { PROTOCOL_FEE as protocolFee, FEE as fee } from './Constants'
import ethers from 'ethers'
import { Claims, claimsDefault, Due, dueDefault, Pool, poolDefault, Tokens, tokensDefault } from './PairInterface'

export class PairSim {
  public asset: bigint
  public collateral: bigint

  pool: Pool
  claims: Claims
  dues: Due[]
  reserves: Tokens

  constructor(public maturity: bigint) {
    this.asset = 0n
    this.collateral = 0n
    this.dues = []
    this.pool = poolDefault()
    this.claims = claimsDefault()
    this.reserves = tokensDefault()
  }

  mint(
    assetIn: bigint,
    collateralIn: bigint,
    interestIncrease: bigint,
    cdpIncrease: bigint,
    block: ethers.providers.Block
  ):
    | {
        liquidityOut: bigint
        id: bigint
        dueOut: Due
      }
    | string {
    const now = BigInt(block.timestamp)
    const blockNumber = BigInt(block.number)

    this.reserves.asset += assetIn
    this.reserves.collateral += collateralIn

    if (!(now < this.maturity)) return 'Expired'
    if (!(interestIncrease > 0 && cdpIncrease > 0)) return 'Invalid'
    if (!(assetIn > 0)) return 'Invalid'

    let liquidityOut: bigint

    if (this.pool.totalLiquidity == 0n) {
      const liquidityTotal = MintMath.getLiquidityTotal1(assetIn)
      liquidityOut = MintMath.getLiquidity(this.maturity, liquidityTotal, protocolFee, now)
      this.pool.totalLiquidity += liquidityTotal
      this.pool.ownerLiquidity += liquidityTotal - liquidityOut

      //   this.pool.liquidities[factory.owner()] += liquidityTotal - liquidityOut
    } else {
      const liquidityTotal = MintMath.getLiquidityTotal2(
        this.pool.state,
        assetIn,
        interestIncrease,
        cdpIncrease,
        this.pool.totalLiquidity
      )
      liquidityOut = MintMath.getLiquidity(this.maturity, liquidityTotal, protocolFee, now)
      this.pool.totalLiquidity += liquidityTotal
      this.pool.ownerLiquidity += liquidityTotal - liquidityOut

      //     pool.liquidities[factory.owner()] += liquidityTotal - liquidityOut;
    }

    if (!(liquidityOut > 0)) return 'Invalid'

    // pool.liquidities[liquidityTo] += liquidityOut;
    // Implemented below
    this.pool.senderLiquidity += liquidityOut

    let dueOut = dueDefault()

    dueOut.debt = MintMath.getDebt(this.maturity, assetIn, interestIncrease, now)
    dueOut.collateral = MintMath.getCollateral(this.maturity, assetIn, interestIncrease, cdpIncrease, now)
    dueOut.startBlock = blockNumber

    if (!(collateralIn >= dueOut.collateral)) return 'Insufficient'

    dueOut.collateral = collateralIn

    // Due[] storage dues = pool.dues[dueTo];
    // implemented
    const id = BigInt(this.dues.length)
    this.dues.push(dueOut)

    this.pool.state.asset += assetIn
    this.pool.state.interest += interestIncrease
    this.pool.state.cdp += cdpIncrease
    this.pool.lock.collateral += collateralIn

    return {
      liquidityOut: liquidityOut,
      id: id,
      dueOut: dueOut,
    }
  }

  burn(liquidityIn: bigint, block: ethers.providers.Block): Tokens | string {
    const now = BigInt(block.timestamp)

    if (now < this.maturity) return 'Active'
    if (liquidityIn <= 0) return 'Invalid'

    const total = this.pool.totalLiquidity

    let tokensOut = tokensDefault()
    tokensOut.asset = BurnMath.getAsset(
      liquidityIn,
      this.pool.state.asset,
      this.pool.lock.asset,
      this.pool.totalClaims.bond,
      total
    )
    tokensOut.collateral = BurnMath.getCollateral(
      liquidityIn,
      this.pool.state.asset,
      this.pool.lock,
      this.pool.totalClaims,
      total
    )

    this.pool.totalLiquidity -= liquidityIn

    // pool.liquidities[msg.sender] -= liquidityIn;
    // Implemented below
    this.pool.senderLiquidity -= liquidityIn

    if (this.pool.lock.asset >= tokensOut.asset) {
      this.pool.lock.asset -= tokensOut.asset
    } else if (this.pool.lock.asset == 0n) {
      this.pool.state.asset -= tokensOut.asset
    } else {
      this.pool.state.asset -= tokensOut.asset - this.pool.lock.asset
      this.pool.lock.asset = 0n
    }
    this.pool.lock.collateral -= tokensOut.collateral

    this.reserves.asset -= tokensOut.asset
    this.reserves.collateral -= tokensOut.collateral

    return tokensOut
  }

  lend(assetIn: bigint, interestDecrease: bigint, cdpDecrease: bigint, block: ethers.providers.Block): Claims | string {
    const now = BigInt(block.timestamp)

    if (now >= this.maturity) return 'Expired'
    if (interestDecrease <= 0 || cdpDecrease <= 0) return 'Invalid'

    if (this.pool.totalLiquidity <= 0) return 'Invalid'

    this.reserves.asset += assetIn
    if (assetIn <= 0) return 'Invalid'

    if (!LendMath.check(this.pool.state, assetIn, interestDecrease, cdpDecrease, fee)) return 'lend math check fail'

    let claimsOut = claimsDefault()

    claimsOut.bond = LendMath.getBond(this.maturity, assetIn, interestDecrease, now)
    claimsOut.insurance = LendMath.getInsurance(this.maturity, this.pool.state, assetIn, cdpDecrease, now)

    this.pool.totalClaims.bond += claimsOut.bond
    this.pool.totalClaims.insurance += claimsOut.insurance

    this.claims.bond += claimsOut.bond
    this.claims.insurance += claimsOut.insurance

    this.pool.state.asset += assetIn
    this.pool.state.interest -= interestDecrease
    this.pool.state.cdp -= cdpDecrease

    return claimsOut
  }

  withdraw(claimsIn: Claims, block: ethers.providers.Block): Tokens | string {
    const now = BigInt(block.timestamp)

    if (now < this.maturity) return 'Active'
    if (claimsIn.bond <= 0 || claimsIn.insurance <= 0) return 'Invalid'

    let tokensOut = tokensDefault()
    tokensOut.asset = WithdrawMath.getAsset(
      claimsIn.bond,
      this.pool.state.asset,
      this.pool.lock.asset,
      this.pool.totalClaims.bond
    )
    tokensOut.collateral = WithdrawMath.getCollateral(
      claimsIn.insurance,
      this.pool.state.asset,
      this.pool.lock,
      this.pool.totalClaims
    )

    this.pool.totalClaims.bond -= claimsIn.bond
    this.pool.totalClaims.insurance -= claimsIn.insurance

    this.claims.bond -= claimsIn.bond
    this.claims.insurance -= claimsIn.insurance

    if (this.pool.lock.asset >= tokensOut.asset) {
      this.pool.lock.asset -= tokensOut.asset
    } else if (this.pool.lock.asset == 0n) {
      this.pool.state.asset -= tokensOut.asset
    } else {
      this.pool.state.asset -= tokensOut.asset - this.pool.lock.asset
      this.pool.lock.asset = 0n
    }
    this.pool.lock.collateral -= tokensOut.collateral

    this.reserves.asset -= tokensOut.asset
    this.reserves.collateral -= tokensOut.collateral

    return tokensOut
  }

  borrow(
    assetOut: bigint,
    collateralIn: bigint,
    interestIncrease: bigint,
    cdpIncrease: bigint,
    block: ethers.providers.Block
  ): { id: bigint; dueOut: Due } | string {
    const now = BigInt(block.timestamp)
    const blockNumber = BigInt(block.number)

    if (now >= this.maturity) return 'Expired'
    if (assetOut <= 0) return 'Invalid'
    if (interestIncrease <= 0 || cdpIncrease <= 0) return 'Invalid'

    if (this.pool.totalLiquidity <= 0) return 'Invalid'

    if (!BorrowMath.check(this.pool.state, assetOut, interestIncrease, cdpIncrease, fee))
      return 'constant product check'
    let dueOut = dueDefault()
    dueOut.debt = BorrowMath.getDebt(this.maturity, assetOut, interestIncrease, now)
    dueOut.collateral = BorrowMath.getCollateral(this.maturity, this.pool.state, assetOut, cdpIncrease, now)
    dueOut.startBlock = blockNumber

    this.reserves.collateral += collateralIn
    if (!(collateralIn >= dueOut.collateral)) return 'Insufficient'
    dueOut.collateral = collateralIn

    // Due[] storage dues = this.dues[dueTo];
    // Implemented

    const id = BigInt(this.dues.length)
    this.dues.push(dueOut)

    this.pool.state.asset -= assetOut
    this.pool.state.interest += interestIncrease
    this.pool.state.cdp += cdpIncrease
    this.pool.lock.collateral += collateralIn

    this.reserves.asset -= assetOut

    return { id: id, dueOut: dueOut }
  }

  pay(
    assetIn: bigint,
    ids: bigint[],
    debtsIn: bigint[],
    collateralsOut: bigint[],
    block: ethers.providers.Block
  ): bigint | string {
    const now = BigInt(block.timestamp)
    const blockNumber = BigInt(block.number)

    if (!(now < this.maturity)) return 'Expired'
    if (!(ids.length == debtsIn.length)) return 'Invalid'
    if (!(ids.length == collateralsOut.length)) return 'Invalid'

    // Due[] storage dues = pool.dues[owner];
    // Implemented

    let debtIn = 0n
    let collateralOut = 0n

    for (let i = 0; i < ids.length; i++) {
      const due = this.dues[i]

      if (!(due.startBlock != blockNumber)) return 'Invalid'
      if (!(debtsIn[i] > 0)) return 'Invalid'

      debtsIn[i] = PayMath.getDebt(debtsIn[i], due.debt)

      const collateral = PayMath.getCollateral(collateralsOut[i], debtsIn[i], due.collateral, due.debt)
      if (collateral === null) return 'Collateral Null'
      else collateralsOut[i] = collateral

      due.debt -= debtsIn[i]
      due.collateral -= collateralsOut[i]

      debtIn += debtsIn[i]
      collateralOut += collateralsOut[i]
    }

    if (!(assetIn >= debtIn)) return 'Invalid'

    this.pool.lock.asset += assetIn
    this.pool.lock.collateral -= collateralOut

    this.reserves.collateral -= collateralOut

    return collateralOut
  }
}
