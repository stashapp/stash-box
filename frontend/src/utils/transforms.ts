import { MeasurementsInput, BreastTypeEnum } from "src/definitions/globalTypes";

export const boobJobStatus = (val: BreastTypeEnum) => {
  if (val === BreastTypeEnum.NATURAL) return "Natural";
  if (val === BreastTypeEnum.FAKE) return "Augmented";
  if (val === BreastTypeEnum.NA) return "N/A";
  return "Unknown";
};

export const getBraSize = (measurements: MeasurementsInput) =>
  measurements === null ||
  measurements.band_size === null ||
  measurements.cup_size === null
    ? ""
    : (measurements.band_size ?? "??") + (measurements.cup_size ?? "?");

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

export const getBodyModification = (
  bodyMod?: { location: string; description?: string | null }[]
) =>
  (bodyMod ?? [])
    .map(
      (mod) => mod.location + (mod.description ? ` (${mod.description})` : "")
    )
    .join(", ");
