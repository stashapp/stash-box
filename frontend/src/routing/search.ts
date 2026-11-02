import queryString from "query-string";

// Keep existing URLs compatible, including repeated array keys and string IDs.
export const parseSearch = (search: string) => queryString.parse(search);
export const stringifySearch = (search: Record<string, unknown>) => {
  const value = queryString.stringify(search);
  return value ? `?${value}` : "";
};

export const searchString = (value: unknown) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value))
    return value.find((item): item is string => typeof item === "string");
  return undefined;
};

export const searchStrings = (value: unknown) => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === "string");
  return [];
};

export const searchBoolean = (value: unknown) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

export const searchEnum = <T extends string>(
  values: Record<string, T>,
  value: unknown,
) =>
  Object.values(values).find(
    (item) => item.toLowerCase() === searchString(value)?.toLowerCase(),
  );
