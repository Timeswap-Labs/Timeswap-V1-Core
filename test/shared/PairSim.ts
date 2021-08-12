import MintMath from '../libraries/MintMath'
import { PROTOCOL_FEE as protocolFee } from './Constants'

export class PairSim {
  public asset: bigint
  public collateral: bigint

  pool: Pool
  dues: Due[]

  constructor(public maturity: bigint) {
    this.asset = 0n
    this.collateral = 0n
    this.dues = []
    this.pool = poolDefault()
  }

  mint(
    assetIn: bigint,
    collateralIn: bigint,
    interestIncrease: bigint,
    cdpIncrease: bigint,
    now: bigint,
    blockNumber: bigint
  ):
    | {
        liquidityOut: bigint
        id: bigint
        dueOut: Due
      }
    | string {
    if (!(now < this.maturity)) {
      return 'Expired'
    }

    if (!(interestIncrease > 0 && cdpIncrease > 0)) {
      return 'Invalid'
    }

    if (!(assetIn > 0)) {
      return 'Invalid'
    }

    let liquidityOut: bigint

    if (this.pool.totalLiquidity == 0n) {
      const liquidityTotal = MintMath.getLiquidityTotal1(assetIn)
      liquidityOut = MintMath.getLiquidity(this.maturity, liquidityTotal, protocolFee, now)
      this.pool.totalLiquidity += liquidityTotal
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
      //     pool.liquidities[factory.owner()] += liquidityTotal - liquidityOut;
    }

    if (!(liquidityOut > 0)) {
      return 'Invalid'
    }

    // pool.liquidities[liquidityTo] += liquidityOut;

    let dueOut = dueDefault()

    dueOut.debt = MintMath.getDebt(this.maturity, assetIn, interestIncrease, now)
    dueOut.collateral = MintMath.getCollateral(this.maturity, assetIn, interestIncrease, cdpIncrease, now)
    dueOut.startBlock = blockNumber

    if (!(collateralIn >= dueOut.collateral)) {
      return 'Insufficient'
    }

    dueOut.collateral = collateralIn

    // Due[] storage dues = pool.dues[dueTo];
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
}

interface Tokens {
  asset: bigint
  collateral: bigint
}

function tokensDefault(): Tokens {
  return { asset: 0n, collateral: 0n }
}

interface Claims {
  bond: bigint
  insurance: bigint
}

function claimsDefault(): Claims {
  return { bond: 0n, insurance: 0n }
}

interface Due {
  debt: bigint
  collateral: bigint
  startBlock: bigint
}

function dueDefault(): Due {
  return { debt: 0n, collateral: 0n, startBlock: 0n }
}

interface State {
  asset: bigint
  interest: bigint
  cdp: bigint
}

function stateDefault(): State {
  return { asset: 0n, interest: 0n, cdp: 0n }
}

interface Pool {
  state: State
  lock: Tokens
  totalLiquidity: bigint
  totalClaims: Claims
}

function poolDefault(): Pool {
  return { state: stateDefault(), lock: tokensDefault(), totalLiquidity: 0n, totalClaims: claimsDefault() }
}
