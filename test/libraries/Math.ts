export function divUp(x: bigint, y: bigint): bigint {
  let z = x / y
  if (x % y > 0) z++
  return z
}

export function shiftRightUp(x: bigint, y: bigint): bigint {
  let z = x >> y
  if (x != z << y) z++
  return z
}

export function sqrt(val:bigint): bigint {
  let z: bigint = 0n;
  if (val>3){
    z = val;
    let x = (val / 2n) + 1n;
    while (x < z) {
      z = x;
      x = (val / x + x) / 2n;
    } 
    return z;
  } else if (val !=0n) {
    z = 1n;
  }
  return z;
}

export default {
  divUp,
  shiftRightUp,
}
