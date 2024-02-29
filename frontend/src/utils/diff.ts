// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const diffArray = <T extends unknown>(
  a: T[],
  b: T[],
  getKey: (t: T) => string
) => [
  a.filter((x) => !b.some((val) => getKey(val) === getKey(x))),
  b.filter((x) => !a.some((val) => getKey(val) === getKey(x))),
];

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const diffValue = <T extends unknown>(
  a: T | undefined | null,
  b: T | undefined | null
): T | null => (a && a !== b ? a : null);

export const diffImages = (
  newImages:
    | {
        id: string | undefined;
        url: string | undefined;
        width: number | undefined;
        height: number | undefined;
      }[]
    | undefined,
  oldImages: { id: string; url: string; width: number; height: number }[]
) =>
  diffArray(
    (newImages ?? []).flatMap((i) =>
      i.id && i.url && i.height && i.width
        ? [
            {
              id: i.id,
              url: i.url,
              width: i.width,
              height: i.height,
            },
          ]
        : []
    ),
    oldImages,
    (i) => i.id
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
  }[]
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
    (u) => `${u.site.name ?? "Unknown"}: ${u.url}`
  );
