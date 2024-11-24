import { UrlFragment } from "src/graphql";

export const formatCareer = (
  start?: number | null,
  end?: number | null,
): string | undefined =>
  start || end ? `Active ${start ?? "????"}\u2013${end ?? ""}` : undefined;

export const formatMeasurements = ({
  cup_size,
  band_size,
  hip_size,
  waist_size,
}: {
  cup_size?: string | null;
  band_size?: number | null;
  waist_size?: number | null;
  hip_size?: number | null;
}): string | undefined => {
  if ((cup_size && band_size) || hip_size || waist_size) {
    const bust = cup_size && band_size ? `${band_size}${cup_size}` : "??";
    return `${bust}-${waist_size ?? "??"}-${hip_size ?? "??"}`;
  }
  return undefined;
};

export const getBraSize = (
  cup_size: string | null | undefined,
  band_size: number | null | undefined,
): string | undefined =>
  band_size && cup_size ? `${band_size}${cup_size}` : undefined;

type Image = {
  url: string;
  width: number;
  height: number;
};

export const sortImageURLs = (
  urls: Image[],
  orientation: "portrait" | "landscape",
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
  orientation: "portrait" | "landscape",
) => {
  const images = sortImageURLs(urls, orientation);
  return images?.[0]?.url ?? "";
};

export const imageType = (image?: Image) => {
  if (image && image.height > image.width) {
    return `vertical-img`;
  } else {
    return `horizontal-img`;
  }
};

export const getUrlBySite = (urls: UrlFragment[], name: string) =>
  urls.find((url) => url.site.name === name) ?? urls[0];

export const formatBodyModification = (
  bodyMod?: { location: string; description?: string | null } | null,
) =>
  bodyMod
    ? bodyMod.location +
      (bodyMod.description ? ` (${bodyMod.description})` : "")
    : null;

export const formatBodyModifications = (
  bodyMod?: { location: string; description?: string | null }[] | null,
) => (bodyMod ?? []).map(formatBodyModification).join(", ");

export const formatPendingEdits = (count?: number) =>
  count ? ` (${count} Pending)` : "";

export const formatDuration = (dur?: number | null) => {
  if (!dur) return "";
  let value = dur;
  let hour = 0;
  let minute = 0;
  let seconds = 0;
  if (value >= 3600) {
    hour = Math.floor(value / 3600);
    value -= hour * 3600;
  }
  minute = Math.floor(value / 60);
  value -= minute * 60;
  seconds = value;

  const res = [
    minute.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ];
  if (hour) res.unshift(hour.toString());
  return res.join(":");
};

export const parseDuration = (
  dur: string | null | undefined,
): number | null => {
  if (!dur) return null;

  const regex = /^((?<hours>\d+:)?(?<minutes>[0-5]?\d):)?(?<seconds>[0-5]?\d)$/;
  const matches = regex.exec(dur);
  const hours = matches?.groups?.hours ?? "0";
  const minutes = matches?.groups?.minutes ?? "0";
  const seconds = matches?.groups?.seconds ?? "0";

  const duration =
    Number.parseInt(seconds, 10) +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(hours, 10) * 3600;
  return duration > 0 ? duration : null;
};

export const parseBraSize = (braSize = ""): [string | null, number | null] => {
  const band = /^\d+/.exec(braSize)?.[0];
  const bandSize = band ? Number.parseInt(band, 10) : null;
  const cup = bandSize ? braSize.replace(bandSize.toString(), "") : null;
  const cupSize = cup
    ? (/^[a-zA-Z]+/.exec(cup)?.[0]?.toUpperCase() ?? null)
    : null;

  return [cupSize, bandSize];
};
