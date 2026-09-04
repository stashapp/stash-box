export const diffArray = <T>(a: T[], b: T[], getKey: (t: T) => string) => [
  a.filter((x) => !b.some((val) => getKey(val) === getKey(x))),
  b.filter((x) => !a.some((val) => getKey(val) === getKey(x))),
];

export const diffValue = <T>(
  a: T | undefined | null,
  b: T | undefined | null,
): T | null => (a && a !== b ? a : null);

export const diffImages = <
  T extends {
    id?: string | null;
    url?: string | null;
    width?: number | null;
    height?: number | null;
  },
>(
  newImages: T[] | undefined,
  oldImages: T[],
) =>
  diffArray(
    (newImages ?? []).filter(
      (i): i is T => !!(i.id && i.url && i.height && i.width),
    ),
    oldImages,
    (i) => i.id as string,
  );

export const diffURLs = (
  newURLs:
    | {
        url: string | undefined;
        site:
          | {
              id: string | undefined;
              name: string | undefined;
              icon: string | undefined;
            }
          | undefined;
      }[]
    | undefined,
  originalURLs: {
    url: string;
    site: {
      id: string;
      name: string;
      icon: string;
    };
  }[],
) =>
  diffArray(
    (newURLs ?? []).map((u) => ({
      url: u.url ?? "",
      site: {
        id: u.site?.id ?? "",
        name: u.site?.name ?? "",
        icon: u.site?.icon ?? "",
      },
    })),
    originalURLs.map((u) => ({
      url: u.url,
      site: {
        id: u.site.id,
        name: u.site.name,
        icon: u.site.icon,
      },
    })),
    (u) => `${u.site.name ?? "Unknown"}: ${u.url}`,
  );
