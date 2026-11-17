// The arithmetic behind the crop frame, in fractions of the image as the server accepts them, so a frame's
// aspect ratio is not width / height and the image's own proportions enter every locked calculation

import { ImageTypeEnum } from "src/graphql";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
  // Degrees clockwise: the frame is measured against the rotated image
  angle: number;
}

export const FULL_FRAME: CropRect = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  angle: 0,
};

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

export const rotatedSize = (width: number, height: number, angle: number) => {
  const radians = (angle * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
};

/** Pixels the crop comes out at: the same arithmetic and clamps as internal/image/crop.go */
export const cropPixels = (
  rect: CropRect,
  naturalWidth: number,
  naturalHeight: number,
) => {
  const turned = rotatedSize(naturalWidth, naturalHeight, rect.angle);
  const width = Math.round(turned.width);
  const height = Math.round(turned.height);

  const left = clamp(Math.round(rect.x * width), 0, width - 1);
  const top = clamp(Math.round(rect.y * height), 0, height - 1);

  return {
    left,
    top,
    width: clamp(Math.round(rect.width * width), 1, width - left),
    height: clamp(Math.round(rect.height * height), 1, height - top),
  };
};

/** The fractional height giving a frame of targetAspect on an image of imageAspect */
export const heightForWidth = (
  width: number,
  targetAspect: number,
  imageAspect: number,
) => (width * imageAspect) / targetAspect;

export const widthForHeight = (
  height: number,
  targetAspect: number,
  imageAspect: number,
) => (height * targetAspect) / imageAspect;

/** The largest frame of targetAspect that fits, centred */
export const largestCenteredRect = (
  targetAspect: number | undefined,
  imageAspect: number,
  angle = 0,
): CropRect => refitRect({ ...FULL_FRAME, angle }, targetAspect, imageAspect);

export const moveRect = (rect: CropRect, dx: number, dy: number): CropRect => ({
  ...rect,
  x: clamp(rect.x + dx, 0, 1 - rect.width),
  y: clamp(rect.y + dy, 0, 1 - rect.height),
});

export type Handle = "nw" | "ne" | "sw" | "se";

export const MIN_SIZE = 0.02;
// Below this a picture is too small for the site's uses; an area, so one bar covers every template's shape
export const MIN_USABLE_AREA = 600 * 900;
// Area a crop under the floor may keep before the original is deemed spent (75% of each axis)
export const REDUCTION_LIMIT = 0.5625;

export type CropSizeVerdict = "ok" | "marginal" | "too-small";

export const CROP_SIZE_WARNINGS: Record<
  Exclude<CropSizeVerdict, "ok">,
  string
> = {
  marginal:
    "Smaller than ideal resolution, but still close enough to original size.",
  "too-small": "Too extreme a crop for the original image's resolution.",
};

/** A soft judgement of the finished picture's size, shown while framing and repeated in the edit queue */
export const judgedCropSizeVerdict = (
  output: { width: number; height: number },
  source: { width: number; height: number } | undefined,
  types: readonly string[],
): CropSizeVerdict | undefined => {
  if (types.includes(ImageTypeEnum.SHOT_DETAIL)) {
    return undefined;
  }
  // Only something cropped, or labelled as a crop, is judged; old small uploads stay silent
  if (source === undefined && !types.some((type) => type.startsWith("CROP_"))) {
    return undefined;
  }
  return cropSizeVerdict(output, source);
};

/** Usable at all, and if not, whether the original had more to give */
export const cropSizeVerdict = (
  output: { width: number; height: number },
  source?: { width: number; height: number },
): CropSizeVerdict => {
  if (output.width * output.height >= MIN_USABLE_AREA) {
    return "ok";
  }
  if (!source?.width || !source.height) {
    return "marginal";
  }

  const spent =
    output.width * output.height >=
    source.width * source.height * REDUCTION_LIMIT;
  return spent ? "marginal" : "too-small";
};

interface Axis {
  room: number;
  place: (size: number) => number;
}

/** Pinned to the edge opposite the handle, which the frame grows away from */
const anchoredAxis = (
  start: number,
  span: number,
  atFarEdge: boolean,
): Axis => {
  const far = start + span;
  return atFarEdge
    ? { room: far, place: (size) => far - size }
    : { room: 1 - start, place: () => start };
};

// Resize from a corner: the drag asks a size, the image bounds it, then the frame is placed so the pinned
// edge stays put
export interface CropPin {
  axis: "x" | "y";
  position: number;
}

export interface Resize {
  rect: CropRect;
  handle: Handle;
  // How far the pointer has moved since the press, in fractions of the image
  dx: number;
  dy: number;
  // Width over height to lock to, or undefined to drag freely
  targetAspect?: number;
  // The image's own proportions, which every locked calculation needs
  imageAspect: number;
  // Kept on the same spot of the image while the frame scales (Shift-resize)
  pin?: CropPin;
}

export const resizeRect = ({
  rect,
  handle,
  dx,
  dy,
  targetAspect,
  imageAspect,
  pin,
}: Resize): CropRect => {
  const west = handle === "nw" || handle === "sw";
  const north = handle === "nw" || handle === "ne";

  const axisX = anchoredAxis(rect.x, rect.width, west);
  const axisY = anchoredAxis(rect.y, rect.height, north);

  // What the drag asks for, before we even account for the image dims
  const askedWidth = clamp(
    west ? rect.width - dx : rect.width + dx,
    MIN_SIZE,
    1,
  );
  const askedHeight = clamp(
    north ? rect.height - dy : rect.height + dy,
    MIN_SIZE,
    1,
  );
  let width = askedWidth;
  let height = askedHeight;

  if (targetAspect === undefined) {
    width = clamp(width, MIN_SIZE, Math.min(1, axisX.room));
    height = clamp(height, MIN_SIZE, Math.min(1, axisY.room));
  } else {
    const room = Math.min(
      1,
      axisX.room,
      widthForHeight(Math.min(1, axisY.room), targetAspect, imageAspect),
    );
    // Locked, the floor is whichever axis hits MIN_SIZE first
    const smallest = Math.max(
      MIN_SIZE,
      widthForHeight(MIN_SIZE, targetAspect, imageAspect),
    );
    // Room outranks that floor: a frame outside the image is rejected by the server
    width = clamp(width, Math.min(smallest, room), room);
    height = heightForWidth(width, targetAspect, imageAspect);
  }

  let x = axisX.place(width);
  let y = axisY.place(height);

  if (pin) {
    const vertical = pin.axis === "y";
    const line = vertical
      ? rect.y + rect.height * pin.position
      : rect.x + rect.width * pin.position;
    const room = Math.min(
      1,
      pin.position > 0 ? line / pin.position : 1,
      pin.position < 1 ? (1 - line) / (1 - pin.position) : 1,
    );
    if (vertical) {
      height = Math.min(askedHeight, room);
      if (targetAspect !== undefined) {
        width = Math.min(
          widthForHeight(height, targetAspect, imageAspect),
          axisX.room,
        );
        height = heightForWidth(width, targetAspect, imageAspect);
      }
      x = axisX.place(width);
      y = line - height * pin.position;
    } else {
      width = Math.min(askedWidth, room);
      if (targetAspect !== undefined) {
        height = Math.min(
          heightForWidth(width, targetAspect, imageAspect),
          axisY.room,
        );
        width = widthForHeight(height, targetAspect, imageAspect);
      }
      y = axisY.place(height);
      x = line - width * pin.position;
    }
  }

  return { ...rect, width, height, x, y };
};

/** Refit a frame after the image's shape changed, keeping its centre where the subject is */
export const refitRect = (
  rect: CropRect,
  targetAspect: number | undefined,
  imageAspect: number,
): CropRect => {
  const centreX = rect.x + rect.width / 2;
  const centreY = rect.y + rect.height / 2;

  let width = clamp(rect.width, MIN_SIZE, 1);
  let height = clamp(rect.height, MIN_SIZE, 1);

  if (targetAspect !== undefined) {
    height = heightForWidth(width, targetAspect, imageAspect);
    if (height > 1) {
      height = 1;
      width = widthForHeight(height, targetAspect, imageAspect);
    }
  }

  return {
    ...rect,
    width,
    height,
    x: clamp(centreX - width / 2, 0, 1 - width),
    y: clamp(centreY - height / 2, 0, 1 - height),
  };
};

const ASPECT_TOLERANCE = 0.02;

export const matchesAspect = (
  width: number,
  height: number,
  targetAspect: number,
) => {
  if (!(width > 0) || !(height > 0) || !(targetAspect > 0)) {
    return true;
  }
  return (
    Math.abs(width / height - targetAspect) / targetAspect <= ASPECT_TOLERANCE
  );
};

export const isIdentity = (rect: CropRect) =>
  rect.angle === 0 &&
  rect.x === 0 &&
  rect.y === 0 &&
  rect.width === 1 &&
  rect.height === 1;
