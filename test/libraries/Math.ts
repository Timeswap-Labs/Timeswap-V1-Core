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

export function sqrt(val: bigint): bigint {
  let z: bigint = 0n
  if (val > 3) {
    z = val
    let x = val / 2n + 1n
    while (x < z) {
      z = x
      x = (val / x + x) / 2n
    }
    return z
  } else if (val != 0n) {
    z = 1n
  }
  return z
}

export function cbrt(val: bigint): bigint {
  let x = 0n
  for (let y = 1n << 255n; y > 0n; y >>= 3n) {
    x <<= 1n
    let z = 3n * x * (x + 1n) + 1n
    if (val / y >= z) {
      val -= y * z
      x += 1n
    }
  }
  return x
}

export default {
  divUp,
  shiftRightUp,
  sqrt,
}
