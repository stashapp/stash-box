/**
 * The arithmetic behind the crop frame, kept apart from the pointer handling
 * so it can be reasoned about and tested without a DOM
 *
 * Everything is in fractions of the image, matching what the server accepts.
 * That means a frame's aspect ratio is *not* `width / height` (those are
 * fractions of two different spans) so the image's own proportions have to
 * come into every calculation that locks a shape
 *
 * What a resize must hold true, numbered for tests to reference:
 *
 *   I1. The frame stays inside the image. Anything else `crop.go` rejects
 *   I2. Without a hold, the corner opposite the handle does not move
 *   I3. With a target aspect, the shape is exact, not close
 *   I4. Both axes stay at least MIN_SIZE, unless the image has run out:
 *       I1 outranks this, since a frame that left the image to stay
 *       grabbable would not upload at all
 *   I5. With a hold, the held line stays on the same part of the image
 *   I6. All of the above still hold after a second drag from another corner
 */

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees clockwise. The frame is measured against the rotated image. */
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

/**
 * The bounding box of a `width` x `height` rectangle turned by `angle`
 *
 * Rotation grows the canvas rather than clipping the corners, so that
 * straightening a horizon leaves the whole picture available to crop from.
 * libvips does the same on the server, which is what keeps the frame the client
 * drags and the frame the server cuts in agreement
 */
export const rotatedSize = (width: number, height: number, angle: number) => {
  const radians = (angle * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
};

/**
 * How many pixels the crop will come out at
 *
 * The same arithmetic as `CropRect.pixels` in internal/image/crop.go, clamps
 * included, so the number shown is the number produced. Go rounds half away
 * from zero where JavaScript rounds half upward; every value here is positive,
 * so the two agree
 *
 * Exact at an angle of zero. Turned, it is within a pixel or so: libvips grows
 * the canvas to the rotated bounding box the same way, but rounds that box
 * itself, and the fractions are then measured against the rounded result
 */
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

  // The offsets are returned as well as the size, though only the size is
  // displayed. The clamps below exist to stop left + width reaching past the
  // edge, and a result that hid the offsets could not be checked for it
  return {
    left,
    top,
    width: clamp(Math.round(rect.width * width), 1, width - left),
    height: clamp(Math.round(rect.height * height), 1, height - top),
  };
};

/**
 * The fractional height that gives a frame of `targetAspect` on an image whose
 * own proportions are `imageAspect`
 *
 * A half-width, half-height frame on a 200x300 image is 100x150 pixels which
 * gives an aspect of 2:3, not 1:1. This is that conversion, and forgetting it
 * is why a locked frame drifts out of shape as the image changes
 */
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

/**
 * The largest frame of `targetAspect` that fits, centred
 *
 * Where a crop starts from: the most of the picture the chosen shape can hold,
 * so a contributor adjusts rather than builds from nothing
 */
export const largestCenteredRect = (
  targetAspect: number | undefined,
  imageAspect: number,
  angle = 0,
): CropRect =>
  // Refitting the whole frame is the same operation, exactly: it shrinks to the
  // target shape about the frame's centre, and the whole frame's centre is the
  // picture's. Named separately because the two are asked at different moments
  refitRect({ ...FULL_FRAME, angle }, targetAspect, imageAspect);

/**
 * Slide a frame, keeping it inside the image
 *
 * The frame stops at the edge rather than shrinking. Someone dragging a frame
 * that silently resized when it touched a border would have to start again, and
 * the shape is usually the thing they care about most
 */
export const moveRect = (rect: CropRect, dx: number, dy: number): CropRect => ({
  ...rect,
  x: clamp(rect.x + dx, 0, 1 - rect.width),
  y: clamp(rect.y + dy, 0, 1 - rect.height),
});

/**
 * Output widths worth landing on. Largest first only so that a tie goes to the
 * coarser candidate; the score below is what actually decides
 */
const ROUND_STEPS = [1000, 500, 250, 200, 100, 50, 25, 10, 5];

/** The largest step a number is a multiple of, or 0 for none of them */
const roundness = (value: number) => {
  for (const step of ROUND_STEPS) {
    if (value % step === 0) return step;
  }
  return 0;
};

/**
 * How far a frame may be pulled to land on a round size, as a fraction of its
 * own width
 *
 * Small on purpose. Snapping is meant to catch a frame that is nearly right,
 * not to drag it somewhere it was not going: at two percent the pull is a few
 * screen pixels at any sensible zoom, so it reads as the frame settling rather
 * than as the frame disobeying
 */
const SNAP_TOLERANCE = 0.02;

/**
 * Both dimensions round enough to look deliberate
 *
 * Multiples of ten, which is the threshold below which a pair stops reading as
 * a chosen size: 1000 x 1500 was aimed at, 1012 x 1518 merely happened
 */
export const isRoundSize = (width: number, height: number) =>
  width % 10 === 0 && height % 10 === 0;

/**
 * Nudge a frame's width so the crop comes out at a round number of pixels
 *
 * Only the width is chosen. The height is not free: a locked frame has the
 * template's aspect, so the output is `width / targetAspect` whatever else
 * happens, and the two cannot be rounded independently
 *
 * Candidates are scored on how round *both* dimensions come out, so a 2:3
 * frame prefers 1000 x 1500 over 1025 x 1538 even though both widths are
 * multiples of something
 */
export const snapWidth = (
  width: number,
  canvasWidth: number,
  targetAspect: number,
) => {
  const px = width * canvasWidth;
  // A floor as well as a share, or a small frame can never reach the next
  // round number and snapping quietly stops existing at low resolutions
  const limit = Math.max(4, px * SNAP_TOLERANCE);

  let best = width;
  let bestScore = 0;

  for (const step of ROUND_STEPS) {
    const candidate = Math.round(px / step) * step;
    if (candidate < 1 || candidate > canvasWidth) continue;
    if (Math.abs(candidate - px) > limit) continue;

    // The worse half, not the sum. A pair is only as round as its uglier
    // dimension, and adding them lets a very round width outvote a height that
    // is nothing of the kind: on a 16:9 template that picks 1000 x 563 over
    // 1600 x 900, which is exactly backwards.
    const score = Math.min(
      roundness(candidate),
      roundness(Math.round(candidate / targetAspect)),
    );
    if (score > bestScore) {
      bestScore = score;
      best = candidate / canvasWidth;
    }
  }

  return best;
};

export type Handle = "nw" | "ne" | "sw" | "se";

/**
 * A point inside the frame to keep still while it is resized, per axis, as a
 * fraction of the frame
 *
 * A guide sits at a fraction of the frame, so a guide at `p` lands on the
 * image at `y + p * h`. Resizing normally holds a corner and lets that drift;
 * holding the guide instead means solving `y = held - p * h` as the height
 * changes. Nothing else about the drag differs.
 */
export interface HoldPoints {
  x?: number;
  y?: number;
}

/**
 * The largest size that keeps `held` at fraction `p` of the frame while the
 * frame stays inside the image
 *
 * Two constraints, one for each edge: the near edge sits at `held - p * size`
 * and must not go below 0, and the far edge sits at `held + (1 - p) * size`
 * and must not pass 1. A guide at the very edge of the frame only constrains
 * one of them.
 */
const maxSizeHolding = (held: number, p: number) => {
  const before = p > 0 ? held / p : Number.POSITIVE_INFINITY;
  const after = p < 1 ? (1 - held) / (1 - p) : Number.POSITIVE_INFINITY;
  return Math.min(before, after);
};

/** The smallest a frame may be dragged, as a fraction. Below this it is too
 * small to grab hold of again */
export const MIN_SIZE = 0.02;

/**
 * How one axis behaves during a resize: what pins it, and how much room that
 * pinning leaves. Anchoring a corner and holding a line differ only in these
 * two answers, which is what lets a single resize serve both
 */
interface Axis {
  /** The largest the frame may be on this axis before it leaves the image. */
  room: number;
  /** Where the frame starts on this axis, once its size there is settled. */
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

/** Pinned to a line at fraction `p` of the frame, wherever it is on the image */
const heldAxis = (start: number, span: number, p: number): Axis => {
  const held = start + p * span;
  return {
    room: Math.min(1, maxSizeHolding(held, p)),
    place: (size) => held - p * size,
  };
};

/**
 * Resize from a corner: ask, fit, place
 *
 * The drag says what size it wants, the image says how much room there is, and
 * only then is the frame put down. Deciding the size first is what keeps the
 * pinned edge pinned (I2, I5) -- placing the frame and then trimming its size
 * moves whatever it was pinned to
 *
 * With `targetAspect` the axes are coupled, so the tighter one decides and the
 * other follows (I3). With `hold` the frame grows around a line rather than
 * away from a corner
 */
export interface Resize {
  rect: CropRect;
  handle: Handle;
  /** How far the pointer has moved since the press, in fractions of the image */
  dx: number;
  dy: number;
  /** Width over height to lock to, or undefined to drag freely */
  targetAspect?: number;
  /** The image's own proportions, which every locked calculation needs */
  imageAspect: number;
  /** Lines to keep still, from the template. Absent means anchor a corner */
  hold?: HoldPoints;
  /** Pixels across, for snapping. Absent suspends it */
  canvasWidth?: number;
}

export const resizeRect = ({
  rect,
  handle,
  dx,
  dy,
  targetAspect,
  imageAspect,
  hold,
  canvasWidth,
}: Resize): CropRect => {
  const west = handle === "nw" || handle === "sw";
  const north = handle === "nw" || handle === "ne";

  const axisX =
    hold?.x !== undefined
      ? heldAxis(rect.x, rect.width, hold.x)
      : anchoredAxis(rect.x, rect.width, west);
  const axisY =
    hold?.y !== undefined
      ? heldAxis(rect.y, rect.height, hold.y)
      : anchoredAxis(rect.y, rect.height, north);

  // What the drag asks for, before we even account for the image dims
  let width = clamp(west ? rect.width - dx : rect.width + dx, MIN_SIZE, 1);
  let height = clamp(north ? rect.height - dy : rect.height + dy, MIN_SIZE, 1);

  // Snapped here rather than at the end, so the shape follows from the round
  // number instead of being rounded after the fact
  if (targetAspect !== undefined && canvasWidth !== undefined) {
    width = snapWidth(width, canvasWidth, targetAspect);
  }

  if (targetAspect === undefined) {
    width = clamp(width, MIN_SIZE, Math.min(1, axisX.room));
    height = clamp(height, MIN_SIZE, Math.min(1, axisY.room));
  } else {
    const room = Math.min(
      1,
      axisX.room,
      widthForHeight(Math.min(1, axisY.room), targetAspect, imageAspect),
    );
    // Locked, the smallest usable frame is whichever of the two axes hits
    // MIN_SIZE first. Flooring them separately is what pulled the shape apart
    const smallest = Math.max(
      MIN_SIZE,
      widthForHeight(MIN_SIZE, targetAspect, imageAspect),
    );
    // Room outranks that floor: a frame that left the image to stay grabbable
    // would be rejected outright by the server (I1 before I4)
    width = clamp(width, Math.min(smallest, room), room);
    height = heightForWidth(width, targetAspect, imageAspect);
  }

  return {
    ...rect,
    width,
    height,
    x: axisX.place(width),
    y: axisY.place(height),
  };
};

/**
 * Put a frame back inside an image whose shape has changed
 *
 * Rotating grows the canvas, so a frame that fitted before may not now, and a
 * locked one is the wrong shape against the new proportions. The centre is
 * kept, because that is where the subject is: a frame that jumped back to the
 * middle every time the angle nudged would make straightening unusable
 */
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

/**
 * Whether an image's proportions match a template's
 *
 * Compared against the template rather than against a fixed 2:3
 *
 * The tolerance absorbs whole-pixel rounding: a 2:3 crop of an 800px-wide
 * source is out by about a tenth of a percent, where an image that is actually
 * the wrong shape is out by ten or more. Unusable numbers count as matching:
 * an SVG stores -1 for both, and badging it would say nothing true
 */
export const matchesAspect = (
  width: number,
  height: number,
  targetAspect: number,
  tolerance = 0.02,
) => {
  if (!(width > 0) || !(height > 0) || !(targetAspect > 0)) return true;
  return Math.abs(width / height - targetAspect) / targetAspect <= tolerance;
};

/**
 * Whether a frame would leave the image exactly as it is
 *
 * The same test the server makes before deciding whether to re-encode, so the
 * form can offer to crop only when cropping would do something
 */
export const isIdentity = (rect: CropRect) =>
  rect.angle === 0 &&
  rect.x === 0 &&
  rect.y === 0 &&
  rect.width === 1 &&
  rect.height === 1;
