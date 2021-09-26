import MintMath from '../libraries/MintMath'
import BurnMath from '../libraries/BurnMath'
import LendMath from '../libraries/LendMath'
import WithdrawMath from '../libraries/WithdrawMath'
import BorrowMath from '../libraries/BorrowMath'
import PayMath from '../libraries/PayMath'
import ethers from 'ethers'
import { Claims, totalClaimsDefault, Due, dueDefault, Factory, Pool, poolDefault,  Tokens, tokensDefault, initFactory, TotalClaims } from './PairInterface'
import { setUncaughtExceptionCaptureCallback } from 'process'

const ZERO_ADDRESSS ="0x0000000000000000000000000000000000000000"
export class PairSim {
  public asset: string
  public collateral: string
  public protocolFee: bigint
  public fee: bigint
  public pools: Pool[]
  public contractAddress: string
  public factory: Factory



  constructor(asset:string,collateral:string,fee:bigint,protocolFee:bigint, contractAddress:string, factoryAddress:string,owner:string) {
    this.asset = asset
    this.collateral = collateral
    this.fee = fee
    this.protocolFee = protocolFee
    this.pools = []
    this.contractAddress = contractAddress
    this.factory = initFactory(factoryAddress,owner)
  }

  getPool(maturity: bigint): Pool{
    let pool = this.pools.find((x)=>x.maturity == maturity)
    if(pool == undefined){
      pool = poolDefault(maturity)
    }
    return pool
  }
  getLiquidity(pool: Pool, liquidityProvider: string){
    const liquidity = pool.liquidities.find((x)=>(x.liquidityProvider == liquidityProvider))
    if(liquidity == undefined){
      return -1n
    }
    else return liquidity.liquidity
  }
  getClaims(pool: Pool, lender: string){
    const claims = pool.claims.find((x)=>(x.lender == lender))
    if(claims == undefined){
      return totalClaimsDefault()
    }
    else return claims.claims
  }
  getDues(pool: Pool, borrower: string){
    let dues = pool.dues.find((due)=>due.borrower==borrower)
    if(dues==undefined){
        dues = {borrower: borrower, due: []}
    }
    return dues
  }
  addLiquidity(pool: Pool, liquidity: bigint, liquidityProvider: string){
    const maybeLiquidity = pool.liquidities.find((x)=>(x.liquidityProvider == liquidityProvider))
    if(maybeLiquidity != undefined){
      maybeLiquidity.liquidity += liquidity
    }
    else{
      pool.liquidities.push({liquidityProvider: liquidityProvider, liquidity: liquidity})
    }
    return pool
  }
  removeLiquidity(pool: Pool, liquidity: bigint, liquidityProvider: string){
    const maybeLiquidity = pool.liquidities.find((x)=>(x.liquidityProvider == liquidityProvider))
    if(maybeLiquidity != undefined){
      maybeLiquidity.liquidity -= liquidity
    }
    return pool
  }

  addDue(pool: Pool, due: Due[], dueTo: string){
    const dues = pool.dues.find((due)=>due.borrower==dueTo)
    if(dues!=undefined){
        dues.due = due
    }
    else {
      pool.dues.push({borrower: dueTo, due: due})
    }
  }

  addClaim(pool: Pool, claim: TotalClaims,lender: string){
    const maybeClaim = pool.claims.find((x)=>(x.lender == lender))
    if(maybeClaim != undefined){
      maybeClaim.claims.bond += claim.bond
      maybeClaim.claims.insurance += claim.insurance

    }
    else{
      pool.claims.push({lender: lender, claims: claim})
    }
    return pool
  }
  mint(
    maturity: bigint,
    liquidityTo: string,
    dueTo: string,
    assetIn: bigint,
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



    if (!(now < maturity)) return 'Expired'
    if( !(liquidityTo != ZERO_ADDRESSS && dueTo != ZERO_ADDRESSS)) return 'Zero'
    if( !(liquidityTo != this.contractAddress && dueTo != this.contractAddress)) return 'Invalid'
    if (!(interestIncrease > 0 && cdpIncrease > 0)) return 'Invalid'
    if (!(assetIn > 0)) return 'Invalid'

    let pool = this.getPool(maturity)

    let liquidityOut: bigint

    if (pool.state.totalLiquidity == 0n) {
      const liquidityTotal = MintMath.getLiquidityTotal1(assetIn)
      liquidityOut = MintMath.getLiquidity(maturity, liquidityTotal, this.protocolFee, now)
      pool.state.totalLiquidity += liquidityTotal
      pool = this.addLiquidity(pool,liquidityTotal-liquidityOut,this.factory.owner)
    } else {
      const liquidityTotal = MintMath.getLiquidityTotal2(
        pool.state,
        assetIn,
        interestIncrease,
        cdpIncrease
      )
      liquidityOut = MintMath.getLiquidity(maturity, liquidityTotal, this.protocolFee, now)
      pool.state.totalLiquidity += liquidityTotal
      pool = this.addLiquidity(pool,liquidityTotal - liquidityOut,this.factory.owner);
    }

      
    if (!(liquidityOut > 0)) return 'Invalid'

    
 
    pool = this.addLiquidity(pool,liquidityOut, liquidityTo)

    let dueOut = dueDefault()

    dueOut.debt = MintMath.getDebt(maturity, assetIn, interestIncrease, now)
    dueOut.collateral = MintMath.getCollateral(maturity, assetIn, interestIncrease, cdpIncrease, now)
    dueOut.startBlock = blockNumber

    const dues = this.getDues(pool,dueTo)
    const id = BigInt(pool.dues.length)
    dues.due.push(dueOut)
    this.addDue(pool, dues.due,dueTo)
    pool.state.totalDebtCreated += dueOut.debt;
    pool.state.reserves.asset += assetIn
    pool.state.reserves.collateral += dueOut.collateral
    pool.state.asset += assetIn
    pool.state.interest += interestIncrease
    pool.state.cdp += cdpIncrease

    this.pools.push(pool)

    return {
      liquidityOut: liquidityOut,
      id: id,
      dueOut: dueOut,
    }
  }

  burn(maturity: bigint, assetTo: string,collateralTo: string,liquidityIn: bigint, sender: string, block: ethers.providers.Block): Tokens | string {
    const now = BigInt(block.timestamp)

    if (now < maturity) return 'Active'
    if( !(assetTo != ZERO_ADDRESSS && collateralTo != ZERO_ADDRESSS)) return 'Zero'
    if( !(assetTo != this.contractAddress && collateralTo != this.contractAddress)) return 'Invalid'
    if (liquidityIn <= 0) return 'Invalid'


    let pool = this.getPool(maturity)

    let tokensOut = tokensDefault()
    tokensOut.asset = BurnMath.getAsset(
      pool.state,
      liquidityIn
    )
    tokensOut.collateral = BurnMath.getCollateral(
      pool.state,
      liquidityIn,
    )

    pool.state.totalLiquidity -= liquidityIn

    // pool.liquidities[msg.sender] -= liquidityIn;
    // Implemented below
    this.removeLiquidity(pool,liquidityIn,sender)


    pool.state.reserves.asset -= tokensOut.asset
    pool.state.reserves.collateral -= tokensOut.collateral
    
    return tokensOut
  }

  lend(maturity:bigint, bondTo: string, insuranceTo:string,assetIn: bigint, interestDecrease: bigint, cdpDecrease: bigint, block: ethers.providers.Block): TotalClaims | string {
    const now = BigInt(block.timestamp)

    if (now >= maturity) return 'Expired'
    if( !(bondTo != ZERO_ADDRESSS && insuranceTo != ZERO_ADDRESSS)) return 'Zero'
    if( !(bondTo != this.contractAddress && insuranceTo != this.contractAddress)) return 'Invalid'
    if (assetIn <= 0) return 'Invalid'
    if (interestDecrease <= 0 || cdpDecrease <= 0) return 'Invalid'

    const pool = this.getPool(maturity)

    if (pool.state.totalLiquidity <= 0) return 'Invalid'


    if (!LendMath.check(pool.state, assetIn, interestDecrease, cdpDecrease, this.fee)) return 'lend math check fail'

    let claimsOut = totalClaimsDefault()

    claimsOut.bond = LendMath.getBond(maturity, assetIn, interestDecrease, now)
    claimsOut.insurance = LendMath.getInsurance(maturity, pool.state, assetIn, cdpDecrease, now)

    
    
    pool.state.totalClaims.bond += claimsOut.bond
    pool.state.totalClaims.insurance += claimsOut.insurance
  
    this.addClaim(pool,claimsOut,bondTo)

    pool.state.reserves.asset += assetIn


    pool.state.asset += assetIn
    pool.state.interest -= interestDecrease
    pool.state.cdp -= cdpDecrease

    return claimsOut
  }

  // withdraw(claimsIn: Claims, block: ethers.providers.Block): Tokens | string {
  //   const now = BigInt(block.timestamp)

  //   if (now < this.maturity) return 'Active'
  //   if (claimsIn.bond <= 0 || claimsIn.insurance <= 0) return 'Invalid'

  //   let tokensOut = tokensDefault()
  //   tokensOut.asset = WithdrawMath.getAsset(
  //     claimsIn.bond,
  //     this.pool.state.asset,
  //     this.pool.lock.asset,
  //     this.pool.totalClaims.bond
  //   )
  //   tokensOut.collateral = WithdrawMath.getCollateral(
  //     claimsIn.insurance,
  //     this.pool.state.asset,
  //     this.pool.lock,
  //     this.pool.totalClaims
  //   )
    

  //   this.pool.totalClaims.bond -= claimsIn.bond
  //   this.pool.totalClaims.insurance -= claimsIn.insurance

    
  //   this.claims.bond -= claimsIn.bond
  //   this.claims.insurance -= claimsIn.insurance

  //   // if (this.pool.lock.asset >= tokensOut.asset) {
  //   //   this.pool.lock.asset -= tokensOut.asset
  //   // } else if (this.pool.lock.asset == 0n) {
  //   //   this.pool.state.asset -= tokensOut.asset
  //   // } else {
  //   //   this.pool.state.asset -= tokensOut.asset - this.pool.lock.asset
  //   //   this.pool.lock.asset = 0n
  //   // }
  //   // this.pool.lock.collateral -= tokensOut.collateral

  //   this.reserves.asset -= tokensOut.asset
  //   this.reserves.collateral -= tokensOut.collateral

  //   return tokensOut
  // }

  // borrow(
  //   assetOut: bigint,
  //   interestIncrease: bigint,
  //   cdpIncrease: bigint,
  //   block: ethers.providers.Block
  // ): { id: bigint; dueOut: Due } | string {
  //   const now = BigInt(block.timestamp)
  //   const blockNumber = BigInt(block.number)

  //   if (now >= this.maturity) return 'Expired'
  //   if (assetOut <= 0) return 'Invalid'
  //   if (interestIncrease <= 0 || cdpIncrease <= 0) return 'Invalid'

  //   if (this.pool.totalLiquidity <= 0) return 'Invalid'

  //   if (!BorrowMath.check(this.pool.state, assetOut, interestIncrease, cdpIncrease, fee))
  //     return 'constant product check'
  //   let dueOut = dueDefault()

    
  //   dueOut.debt = BorrowMath.getDebt(this.maturity, assetOut, interestIncrease, now)
  //   dueOut.collateral = BorrowMath.getCollateral(this.maturity, this.pool.state, assetOut, cdpIncrease, now)
  //   dueOut.startBlock = blockNumber

  //   this.reserves.collateral += dueOut.collateral
    
  //   // Due[] storage dues = this.dues[dueTo];
  //   // Implemented

  //   const id = BigInt(this.dues.length)
  //   this.dues.push(dueOut)
  //   this.pool.totalDebt += dueOut.debt
  //   this.pool.state.asset -= assetOut
  //   this.pool.state.interest += interestIncrease
  //   this.pool.state.cdp += cdpIncrease
  //   this.pool.lock.collateral += dueOut.collateral

  //   this.reserves.asset -= assetOut

  //   return { id: id, dueOut: dueOut }
  // }

  // pay(
  //   ids: bigint[],
  //   debtsIn: bigint[],
  //   collateralsOut: bigint[],
  //   block: ethers.providers.Block
  // ): bigint | string {
  //   const now = BigInt(block.timestamp)
  //   const blockNumber = BigInt(block.number)

  //   if (!(now < this.maturity)) return 'Expired'
  //   if (!(ids.length == debtsIn.length)) return 'Invalid'
  //   if (!(ids.length == collateralsOut.length)) return 'Invalid'

  //   // Due[] storage dues = pool.dues[owner];
  //   // Implemented

  //   let debtIn = 0n
  //   let collateralOut = 0n

  //   for (let i = 0; i < ids.length; i++) {
  //     const due = this.dues[i]

  //     if (!(due.startBlock != blockNumber)) return 'Invalid'
  //     if (!(debtsIn[i] > 0)) return 'Invalid'

  //     debtsIn[i] = PayMath.getDebt(debtsIn[i], due.debt)

  //     const collateral = PayMath.getCollateral(collateralsOut[i], debtsIn[i], due.collateral, due.debt)
  //     if (collateral === null) return 'Collateral Null'
  //     else collateralsOut[i] = collateral

  //     due.debt -= debtsIn[i]
  //     due.collateral -= collateralsOut[i]

  //     debtIn += debtsIn[i]
  //     collateralOut += collateralsOut[i]
  //   }


  //   this.pool.lock.asset += debtIn
  //   this.pool.lock.collateral -= collateralOut

  //   this.reserves.asset += debtIn
  //   this.reserves.collateral -= collateralOut

  //   return collateralOut
  // }
}
