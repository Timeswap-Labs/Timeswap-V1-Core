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
  cbrt,
}
