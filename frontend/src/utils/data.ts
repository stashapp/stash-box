export const filterData = <T>(data?: (T | null | undefined)[] | null) =>
  data ? (data.filter((item) => item) as T[]) : [];

export const compareByName = <T extends { name: string }>(a: T, b: T) =>
  a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
