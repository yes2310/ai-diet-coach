type KoreanProductAlias = {
  readonly pattern: RegExp;
  readonly terms: readonly string[];
  readonly impliedBrands: readonly string[];
};

type KoreanTermAlias = {
  readonly pattern: RegExp;
  readonly terms: readonly string[];
};

const koreanProductAliases: readonly KoreanProductAlias[] = [
  {
    pattern: /신\s*라면/i,
    terms: ["shin ramen", "shin ramyun"],
    impliedBrands: ["nongshim"],
  },
  {
    pattern: /짜파게티/i,
    terms: ["chapaghetti", "japaghetti"],
    impliedBrands: ["nongshim"],
  },
  {
    pattern: /너구리/i,
    terms: ["neoguri"],
    impliedBrands: ["nongshim"],
  },
  {
    pattern: /진\s*라면/i,
    terms: ["jin ramen", "jin ramyun"],
    impliedBrands: ["ottogi"],
  },
  {
    pattern: /불닭/i,
    terms: ["buldak"],
    impliedBrands: ["samyang"],
  },
];

const koreanBrandAliases: readonly KoreanTermAlias[] = [
  { pattern: /농심/i, terms: ["nongshim"] },
  { pattern: /오뚜기/i, terms: ["ottogi"] },
  { pattern: /삼양/i, terms: ["samyang"] },
];

const koreanPackageAliases: readonly KoreanTermAlias[] = [
  { pattern: /컵라면|큰사발|사발면|사발|컵/i, terms: ["cup", "cup noodle"] },
  { pattern: /봉지라면|봉지/i, terms: ["noodle"] },
];

export function buildProductSearchQueries(rawQuery: string) {
  const query = normalizeSearchQuery(rawQuery);

  if (!query) {
    return [];
  }

  const queries: string[] = [];
  const matchedProducts = koreanProductAliases.filter((alias) =>
    alias.pattern.test(query),
  );
  const matchedBrands = koreanBrandAliases.flatMap((alias) =>
    alias.pattern.test(query) ? alias.terms : [],
  );
  const matchedPackages = koreanPackageAliases.flatMap((alias) =>
    alias.pattern.test(query) ? alias.terms : [],
  );
  const impliedBrands = matchedProducts.flatMap((alias) => alias.impliedBrands);
  const brandTerms = uniqueStrings([...matchedBrands, ...impliedBrands]);
  const packageTerms = matchedPackages.length ? uniqueStrings(matchedPackages) : [""];

  for (const product of matchedProducts.flatMap((alias) => alias.terms)) {
    for (const packageTerm of packageTerms) {
      addQuery(queries, [product, packageTerm]);

      for (const brand of brandTerms) {
        addQuery(queries, [brand, product, packageTerm]);
      }
    }
  }

  addQuery(queries, [romanizeKnownKoreanTerms(query)]);
  addQuery(queries, [query]);

  return uniqueStrings(queries);
}

export function hasCupSearchIntent(rawQuery: string) {
  return /컵라면|큰사발|사발면|사발|컵|\bcups?\b|\bbowl\b/i.test(rawQuery);
}

function romanizeKnownKoreanTerms(query: string) {
  let romanized = query;

  for (const alias of [
    ...koreanBrandAliases,
    ...koreanProductAliases,
    ...koreanPackageAliases,
  ]) {
    const [primaryTerm] = alias.terms;

    if (primaryTerm) {
      romanized = romanized.replace(alias.pattern, primaryTerm);
    }
  }

  return normalizeSearchQuery(romanized);
}

function addQuery(queries: string[], parts: readonly string[]) {
  const query = normalizeSearchQuery(parts.filter(Boolean).join(" "));

  if (query) {
    queries.push(query);
  }
}

function normalizeSearchQuery(query: string) {
  return query.trim().replace(/\s+/g, " ");
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values)];
}
