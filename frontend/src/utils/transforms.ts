import { Performer_findPerformer_measurements as Measurements } from "src/definitions/Performer";

export const formatCareer = (start?: number|null, end?: number|null): string|undefined => (
  (start || end) ? `Active ${start ?? '????'}\u2013${end ?? ''}` : undefined
);

export const formatMeasurements = (val?: Measurements): string|undefined => (
  ((val?.cup_size && val.band_size) || val?.hip || val?.waist) ?
  `${val.cup_size && val.band_size ? val.band_size + val.cup_size : '??'}-${val.waist ?? '??'}-${val.hip ?? '??'}` : undefined
);

export const getBraSize = (measurements: Measurements): string|undefined =>
  (measurements.cup_size && measurements.cup_size && `${measurements.band_size}${measurements.cup_size}`) ?? undefined;

export interface URL {
  url: string;
  type: string;
}

export interface Image {
  url: string;
  id: string;
  width: number;
  height: number;
}

export const sortImageURLs = (
  urls: Image[],
  orientation: "portrait" | "landscape"
) =>
  urls
    .map((u) => ({
      ...u,
      aspect:
        orientation === "portrait"
          ? u.height / u.width > 1
          : u.width / u.height > 1,
    }))
    .sort((a, b) => {
      if (a.aspect > b.aspect) return -1;
      if (a.aspect < b.aspect) return 1;
      if (orientation === "portrait" && a.height > b.height) return -1;
      if (orientation === "portrait" && a.height < b.height) return 1;
      if (orientation === "landscape" && a.width > b.width) return -1;
      if (orientation === "landscape" && a.width < b.width) return 1;
      return 0;
    });

export const getImage = (
  urls: Image[],
  orientation: "portrait" | "landscape"
) => {
  const images = sortImageURLs(urls, orientation);
  return images?.[0]?.url ?? "";
};

export const getUrlByType = (urls: (URL | null)[], type: string) =>
  (urls && (urls.find((url) => url?.type === type) || {}).url) || "";

export const formatBodyModifications = (
  bodyMod?: { location: string; description?: string | null }[] | null
) =>
  (bodyMod ?? [])
    .map(
      (mod) => mod.location + (mod.description ? ` (${mod.description})` : "")
    )
    .join(", ");
