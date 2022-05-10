import Countries from "i18n-iso-countries";
import english from "i18n-iso-countries/langs/en.json";

Countries.registerLocale(english);

const fuzzyDict: Record<string, string> = {
  USA: "US",
  "United States": "US",
  America: "US",
  American: "US",
  Czechia: "CZ",
  England: "GB",
  "United Kingdom": "GB",
  Russia: "RU",
  "Slovak Republic": "SK",
};

export const getISOCountry = (country: string | null | undefined) => {
  if (!country) return null;

  const code = fuzzyDict[country] ?? Countries.getAlpha2Code(country, "en");
  if (!code) return null;

  return {
    code,
    name: Countries.getName(code, "en"),
  };
};

export const getCountryByISO = (iso?: string | null) => {
  if (!iso) return null;
  const country = Countries.getName(iso, "en", { select: "alias" });
  return country ?? null;
};
