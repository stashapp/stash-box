import queryString from "query-string";

// Keep existing URLs compatible, including repeated array keys and string IDs.
export const parseSearch = (search: string) => queryString.parse(search);
export const stringifySearch = (search: Record<string, unknown>) => {
  const value = queryString.stringify(search);
  return value ? `?${value}` : "";
};
