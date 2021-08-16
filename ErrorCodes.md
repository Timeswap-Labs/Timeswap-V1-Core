# Error Codes

Documents all the Error Codes in Timeswap-V1-Core.

## `Factory.sol`

### E101

Address Zero error.

The address (or the address of the ERC20 token) passed is 0. 

Can occur in `constructor`, `createPair` or `setOwner`.

Check the address passed, and verify if it is not 0.

### E102

Not the intended caller.

The caller doesn't have enough privileges to call the function.

Can occur in `setOwner` or `acceptOwner`.

If the error occurs in `setOwner` check if `owner` is calling the function. If the error occurs in `acceptOwner` check if the `pendingOwner` is calling the function.

### E103

Identical asset and collateral.

The asset token and collateral token passed are identical.

Can occur in `createPair`.

Check the `asset` and the `collateral` passed, and verify that they are not the same.

### E104

A similar Pair contract exist.

A pair contract with the same asset and collateral already exists.

Can occur in `createPair`

Check the `asset` and the `collateral` passed, and verify that they are the intended tokens. If they are the intended tokens then don't proceed to create a pair, and try getting the existing pair.

## `Pair.sol`

### E201

Address Zero error.

The address (or the address of the ERC20 token) passed is 0. 

Can occur in `mint`, `burn`, `lend`, `withdraw`, `borrow` or `pay`.

Check the address passed, and verify if it is not 0.

### E202

Trying to do an operation on a pool which has already matured.

Some operations like mint, lend, etc. can't be performed on a pool which has already matured.

Can occur in `mint`, `lend`, `borrow`, or `pay`.

Check the maturity and verify that the pool has not yet matured.

### E203

Trying to do an operation on a pool which hasn't yet matured.

Operations like burn and withdraw can only be performed on a pool after maturity.

Can occur in `burn` or `withdraw`.

Check the maturity and verify that the pool has matured.
