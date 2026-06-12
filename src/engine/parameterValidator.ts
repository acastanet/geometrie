export function isValidPair(a: number, b: number): boolean {
  if (a === 0 || b === 0) return false;
  if (Math.abs(a) === Math.abs(b)) return false;
  if (Math.abs(b / a) > 6) return false;
  return true;
}

export function arePairsDistinct(pairs: [number, number][]): boolean {
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      if (pairs[i][0] === pairs[j][0] && pairs[i][1] === pairs[j][1]) {
        return false;
      }
    }
  }
  return true;
}
