function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/&/g, ' ')
    .replace(/\b(supermarket|supermarkets|marketplace|market|inc|fresh|super)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchChainName(
  osmName: string,
  osmBrand: string | null,
  flippChains: string[]
): string | null {
  const candidates = [osmBrand, osmName].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const norm = normalize(candidate);
    for (const chain of flippChains) {
      const chainNorm = normalize(chain);
      if (norm === chainNorm) return chain;
      if (norm.includes(chainNorm) || chainNorm.includes(norm)) return chain;
    }
  }

  return null;
}
