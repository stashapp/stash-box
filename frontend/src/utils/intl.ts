const enOrdinalRules = new Intl.PluralRules("en-US", { type: "ordinal" });

const suffixes = new Map([
  ["one", "st"],
  ["two", "nd"],
  ["few", "rd"],
  ["other", "th"],
]);

export const formatOrdinals = (num: number) => {
  const rule = enOrdinalRules.select(num);
  const suffix = suffixes.get(rule);
  return `${num}${suffix}`;
};
