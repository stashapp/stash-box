export const diffArray = <T>(a: T[], b: T[], getKey: (t: T) => string) => [
  a.filter((x) => !b.some((val) => getKey(val) === getKey(x))),
  b.filter((x) => !a.some((val) => getKey(val) === getKey(x))),
];

export const diffValue = <T>(
  a: T | undefined | null,
  b: T | undefined | null,
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
  oldImages: { id: string; url: string; width: number; height: number }[],
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
        : [],
    ),
    oldImages,
    (i) => i.id,
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

export const diffImageLabels = <TImage extends { id: string }>(
  newImages: {
    image: TImage;
    types: string[];
    date?: string | null;
  }[],
  oldImages: {
    image: { id: string };
    types: string[];
    date?: string | null;
  }[],
) => {
  const previous = new Map(oldImages.map((entry) => [entry.image.id, entry]));

  return newImages.flatMap((entry) => {
    const before = previous.get(entry.image.id);
    const beforeTypes = before?.types ?? [];

    const added = entry.types.filter((type) => !beforeTypes.includes(type));
    const removed = beforeTypes.filter((type) => !entry.types.includes(type));

    const beforeDate = before?.date ?? null;
    const afterDate = entry.date || null;
    const dateChanged = before !== undefined && beforeDate !== afterDate;

    if (added.length === 0 && removed.length === 0 && !dateChanged) return [];

    return [
      {
        image: entry.image,
        added_types: added,
        removed_types: removed,
        date: afterDate,
        date_changed: dateChanged,
      },
    ];
  });
};
