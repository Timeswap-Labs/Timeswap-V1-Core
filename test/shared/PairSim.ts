import MintMath from '../libraries/MintMath'
import BurnMath from '../libraries/BurnMath'
import LendMath from '../libraries/LendMath'
import WithdrawMath from '../libraries/WithdrawMath'
import BorrowMath from '../libraries/BorrowMath'
import { PROTOCOL_FEE as protocolFee, FEE as fee } from './Constants'

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

  burn(
    liquidityIn: bigint,
    now: bigint
  ): Tokens | string {
    if (now < this.maturity) return 'Active'
    if (liquidityIn <= 0) return 'Invalid'


    const total = this.pool.totalLiquidity;

    let tokensOut = tokensDefault()
    tokensOut.asset = BurnMath.getAsset(liquidityIn, this.pool.state.asset, this.pool.lock.asset, this.pool.totalClaims.bond, total)
    tokensOut.collateral = BurnMath.getCollateral(liquidityIn, this.pool.state.asset, this.pool.lock, this.pool.totalClaims, total)

    this.pool.totalLiquidity -= liquidityIn

    // pool.liquidities[msg.sender] -= liquidityIn;

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

  lend(
    assetIn: bigint,
    interestDecrease: bigint,
    cdpDecrease: bigint,
    now: bigint,
  ) : Claims | string {
    if (now >= this.maturity) return 'Expired'
    if (interestDecrease <= 0 || cdpDecrease <= 0) return 'Invalid'

    if (this.pool.totalLiquidity <= 0) return 'Invalid'

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

  withdraw(
    claimsIn : Claims,
    now: bigint
  ) : Tokens | string {
    if (now < this.maturity) return 'Active'
    if (claimsIn.bond <= 0 || claimsIn.insurance <= 0) return 'Invalid'

    let tokensOut = tokensDefault()
    tokensOut.asset = WithdrawMath.getAsset(claimsIn.bond, this.pool.state.asset, this.pool.lock.asset, this.pool.totalClaims.bond)
    tokensOut.collateral = WithdrawMath.getCollateral(
        claimsIn.insurance,
        this.pool.state.asset,
        this.pool.lock,
        this.pool.totalClaims
    );

    this.pool.totalClaims.bond -= claimsIn.bond;
    this.pool.totalClaims.insurance -= claimsIn.insurance;

    this.claims.bond -= claimsIn.bond;
    this.claims.insurance -= claimsIn.insurance;

    if (this.pool.lock.asset >= tokensOut.asset) { 
      this.pool.lock.asset -= tokensOut.asset;
    } else if (this.pool.lock.asset == 0n) {
      this.pool.state.asset -= tokensOut.asset
    } else {
      this.pool.state.asset -= tokensOut.asset - this.pool.lock.asset
      this.pool.lock.asset = 0n;
    }
    this.pool.lock.collateral -= tokensOut.collateral;

    this.reserves.asset -= tokensOut.asset;
    this.reserves.collateral -= tokensOut.collateral;

    return tokensOut
  }

  borrow(
    assetOut: bigint,
    interestIncrease: bigint,
    cdpIncrease: bigint,
    now: bigint,
  ) : { bigint, Due } | string {        
    if (now >= this.maturity) return 'Expired'
    if (assetOut <= 0) return 'Invalid'
    if(interestIncrease <= 0 || cdpIncrease <= 0) return 'Invalid'

    if (this.pool.totalLiquidity <= 0) return 'Invalid'

    if (!BorrowMath.check(this.pool.state, assetOut, interestIncrease, cdpIncrease, fee)) return 'constant product check'
    let dueOut = dueDefault()
    dueOut.debt = BorrowMath.getDebt(maturity, assetOut, interestIncrease);
    dueOut.collateral = BorrowMath.getCollateral(maturity, pool.state, assetOut, cdpIncrease);
    dueOut.startBlock = BlockNumber.get();

    uint112 collateralIn = collateral.getCollateralIn(reserves);
    require(collateralIn >= dueOut.collateral, 'Insufficient');
    dueOut.collateral = collateralIn;

    Due[] storage dues = pool.dues[dueTo];

    id = dues.length;
    dues.push(dueOut);

    pool.state.asset -= assetOut;
    pool.state.interest += interestIncrease;
    pool.state.cdp += cdpIncrease;
    pool.lock.collateral += collateralIn;

    reserves.asset -= assetOut;

    if (assetTo != address(this)) asset.safeTransfer(assetTo, assetOut);
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
