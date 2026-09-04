import { faCircleInfo, faRotate } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import {
  type FC,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "react-bootstrap";
import { EditorCard, Icon } from "src/components/fragments";
import type { CropGuide } from "src/graphql";
import { useMeasuredAspect } from "src/hooks";

import CropOverlay from "./CropOverlay";
import {
  type CropRect,
  cropPixels,
  type Handle,
  type HoldPoints,
  isRoundSize,
  largestCenteredRect,
  moveRect,
  refitRect,
  resizeRect,
  rotatedSize,
} from "./geometry";
import { holdPointsFor } from "./holds";

const CLASSNAME = "CropFrame";
const HANDLES: Handle[] = ["nw", "ne", "sw", "se"];

/**
 * A rotate zone per compass point around the photo's own edge -- corners and
 * edge midpoints both, so the whole perimeter is grabbable rather than just
 * its four corners. Order matters here: it is the order the cursor rotates
 * through in styles.scss, one 45° step per entry.
 */
const ROTATE_ZONES = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;

const ROTATE_ZONE_NAME: Record<(typeof ROTATE_ZONES)[number], string> = {
  n: "top edge",
  ne: "top-right corner",
  e: "right edge",
  se: "bottom-right corner",
  s: "bottom edge",
  sw: "bottom-left corner",
  w: "left edge",
  nw: "top-left corner",
};

const MAX_ANGLE = 90;

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/** The angle, in degrees, from `origin` to `point`. */
const angleTo = (
  origin: { x: number; y: number },
  point: { x: number; y: number },
) => (Math.atan2(point.y - origin.y, point.x - origin.x) * 180) / Math.PI;

/** The shortest turn from one angle to another, in (-180, 180]. */
const angleDelta = (from: number, to: number) =>
  ((((to - from + 180) % 360) + 360) % 360) - 180;

const suspendsSnapping = (event: ReactPointerEvent<HTMLElement>) =>
  event.ctrlKey || event.metaKey;

const SUSPEND_KEY =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
    ? "⌘"
    : "Ctrl";

interface CropFrameProps {
  /** Object URL of the image being cropped */
  src: string;
  /** Natural size of that image, before any rotation */
  naturalWidth: number;
  naturalHeight: number;
  /** Width over height to lock the frame to, or undefined to drag freely */
  aspectRatio?: number;
  guides?: CropGuide[];
  value: CropRect;
  onChange: (rect: CropRect) => void;
  /**
   * Sizes the stage to fill whatever height its own flex parent actually
   * has, rather than the default width-first fit capped at a fraction of
   * the viewport. The default suits a page that can scroll if the picture
   * needs more room than it is given; a host with a fixed height and no
   * scroll -- a modal -- needs the picture to land in exactly the box it
   * has, on any aspect ratio, which only measuring can guarantee
   */
  fill?: boolean;
  /**
   * Omits the status readout and rotate slider, for a host that renders
   * them elsewhere via CropFrameControls instead -- see CropStep's
   * side-by-side layout.
   */
  hideControls?: boolean;
}

/**
 * An aspect-locked frame dragged over an image, with the chosen template's
 * guides drawn inside it
 *
 * Presentational and controlled: the frame is described entirely by `value`,
 * in fractions of the rotated image, which is exactly what the server accepts.
 * Nothing here reads or writes a file because cropping happens on the server, and
 * what this produces is the rectangle describing it
 */
const CropFrame: FC<CropFrameProps> = ({
  src,
  naturalWidth,
  naturalHeight,
  aspectRatio,
  guides = [],
  value,
  onChange,
  fill = false,
  hideControls = false,
}) => {
  const stage = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  // Which of the eight rotate zones currently has the pointer, if any -- the
  // directional arrow is only useful before the press decides which way the
  // photo is actually turning; once it has, a plain grabbing hand says so
  const [rotating, setRotating] = useState(false);

  // Only measured in fill mode: the default width-first fit needs no
  // measurement, it is derived entirely from the image's own aspect ratio
  const { ref: measureFrameArea, aspect: frameAreaAspect } =
    useMeasuredAspect();
  // Which lines the current drag is holding, for the overlay to mark:
  // this is only set while a Shift-resize is under way
  const [held, setHeld] = useState<HoldPoints>();
  const [shiftDown, setShiftDown] = useState(false);

  // Shift shows what a resize would pivot about before the press
  useEffect(() => {
    const track = (event: KeyboardEvent) => setShiftDown(event.shiftKey);
    // Blur too: tabbing away with the key down never delivers the keyup, and
    // the cue would sit there marking a line nothing is holding
    const clear = () => setShiftDown(false);

    window.addEventListener("keydown", track);
    window.addEventListener("keyup", track);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", track);
      window.removeEventListener("keyup", track);
      window.removeEventListener("blur", clear);
    };
  }, []);

  // During a drag the lines are whatever was read at the press, which cannot
  // change halfway through. Outside one, Shift previews what a press would
  // hold, but never during a drag that did not start with it. Otherwise pressing
  // the key mid-drag would promise an anchoring that is not happening
  const previewed = useMemo(() => holdPointsFor(guides), [guides]);
  const marked = held ?? (shiftDown && !dragging ? previewed : undefined);

  // The stage is the rotated image's bounding box, which is what the frame's
  // fractions are measured against. Rotation grows it, matching what the
  // server does, so the frame the contributor drags is the frame that gets cut
  const rotated = rotatedSize(naturalWidth, naturalHeight, value.angle);
  const imageAspect = rotated.width / rotated.height;

  // Mirrors the server's rounding, so the number on screen is the number that comes back
  const output = cropPixels(value, naturalWidth, naturalHeight);

  const drag = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      apply: (dx: number, dy: number) => CropRect,
      onDone?: () => void,
    ) => {
      const box = stage.current?.getBoundingClientRect();
      if (!box || box.width === 0 || box.height === 0) return;

      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      setDragging(true);

      const startX = event.clientX;
      const startY = event.clientY;

      const move = (moveEvent: PointerEvent) => {
        // Deltas from the press rather than from the last event: accumulating
        // per-move deltas drifts, because each one is clamped on the way in
        onChange(
          apply(
            (moveEvent.clientX - startX) / box.width,
            (moveEvent.clientY - startY) / box.height,
          ),
        );
      };

      const done = () => {
        target.releasePointerCapture(event.pointerId);
        target.removeEventListener("pointermove", move);
        target.removeEventListener("pointerup", done);
        target.removeEventListener("pointercancel", done);
        setDragging(false);
        setHeld(undefined);
        onDone?.();
      };

      target.addEventListener("pointermove", move);
      target.addEventListener("pointerup", done);
      target.addEventListener("pointercancel", done);
    },
    [onChange],
  );

  const startMove = (event: ReactPointerEvent<HTMLElement>) => {
    const from = value;
    drag(event, (dx, dy) => moveRect(from, dx, dy));
  };

  const startResize = (
    event: ReactPointerEvent<HTMLElement>,
    handle: Handle,
  ) => {
    const from = value;
    const hold = event.shiftKey ? holdPointsFor(guides) : undefined;
    setHeld(hold);

    // Snapping is on unless suspended, which is the way every editor that has
    // it works: Photoshop, Figma and Inkscape all snap by default and give you
    // a key to hold when you want the tool to stop helping
    const canvasWidth = suspendsSnapping(event) ? undefined : rotated.width;

    drag(event, (dx, dy) =>
      resizeRect({
        rect: from,
        handle,
        dx,
        dy,
        targetAspect: aspectRatio,
        imageAspect,
        hold,
        // Snapping is in pixels so the resize needs to know how
        // many the frame is measured against
        canvasWidth,
      }),
    );
  };

  // Turning reshapes the stage, so a frame that fitted a moment ago may not
  // now: refitting keeps its centre, because that is where the subject is
  const setAngle = (angle: number) => {
    const turned = rotatedSize(naturalWidth, naturalHeight, angle);
    onChange(
      refitRect({ ...value, angle }, aspectRatio, turned.width / turned.height),
    );
  };

  // Neither the frame nor the photo turns on screen -- the photo's pixels
  // turn underneath a screen-fixed frame -- so rotating from a corner is a
  // drag around the stage's own (screen-fixed) centre, not around a corner
  // that is itself moving. The handle sits at the photo's own corner, so
  // the pivot it drags around has to be the photo's own centre too, or the
  // arc your hand traces would not match the one the angle math uses. The
  // press records that centre and the pointer's starting angle around it
  // once; every move since then is just the change in that angle, added to
  // whatever the rotation already was.
  const startRotate = (event: ReactPointerEvent<HTMLElement>) => {
    const from = value;
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;

    const centre = {
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
    };
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const startAngle = angleTo(centre, { x: startClientX, y: startClientY });

    setRotating(true);
    drag(
      event,
      (dx, dy) => {
        const point = {
          x: startClientX + dx * box.width,
          y: startClientY + dy * box.height,
        };
        const angle = clamp(
          from.angle + angleDelta(startAngle, angleTo(centre, point)),
          -MAX_ANGLE,
          MAX_ANGLE,
        );
        const turned = rotatedSize(naturalWidth, naturalHeight, angle);
        return refitRect(
          { ...from, angle },
          aspectRatio,
          turned.width / turned.height,
        );
      },
      () => setRotating(false),
    );
  };

  // Arrow keys nudge the frame. Dragging is pointer-only otherwise, and a
  // fine adjustment is easier to make a keypress at a time than by hand
  const nudge = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 0.05 : 0.005;
    const by: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = by[event.key];
    if (!delta) return;

    event.preventDefault();
    onChange(moveRect(value, delta[0], delta[1]));
  };

  // With no template there is no shape to hold and no line to line anything up
  // against, so the frame is not drawn at all. A border and four handles that
  // only ever select the whole picture are furniture.
  const framed = aspectRatio !== undefined;

  // Applied to both the frame and the shade behind it, which have to describe
  // the same rectangle from either side of the clip
  const frameRect = {
    left: `${value.x * 100}%`,
    top: `${value.y * 100}%`,
    width: `${value.width * 100}%`,
    height: `${value.height * 100}%`,
  };

  // In fill mode the stage's size comes from fitting the rotated image
  // against the measured frame area, contain-style, the same arithmetic
  // ImageLightbox's FittedOverlay uses for the same problem; unmeasured yet
  // is drawn at the image's own aspect so nothing flashes at the wrong shape
  // for a frame before the observer's first callback lands
  const fitted = fill
    ? largestCenteredRect(imageAspect, frameAreaAspect ?? imageAspect)
    : undefined;

  const stageContent = (
    <>
      <div className={`${CLASSNAME}-clip`}>
        <img
          className={`${CLASSNAME}-image`}
          src={src}
          alt=""
          draggable={false}
          style={{
            width: `${(naturalWidth / rotated.width) * 100}%`,
            height: `${(naturalHeight / rotated.height) * 100}%`,
            transform: `translate(-50%, -50%) rotate(${value.angle}deg)`,
          }}
        />
        {framed && <div className={`${CLASSNAME}-shade`} style={frameRect} />}
      </div>

      {framed && (
        <div
          className={cx(`${CLASSNAME}-frame`, {
            [`${CLASSNAME}-frame-dragging`]: dragging,
          })}
          style={frameRect}
        >
          <CropOverlay guides={guides} held={marked} />

          <button
            type="button"
            className={`${CLASSNAME}-grip`}
            aria-label="Crop frame, arrow keys to move"
            onPointerDown={startMove}
            onKeyDown={nudge}
          />

          {HANDLES.map((handle) => (
            <button
              key={handle}
              type="button"
              className={cx(
                `${CLASSNAME}-handle`,
                `${CLASSNAME}-handle-${handle}`,
              )}
              aria-label={`Resize ${handle}`}
              onPointerDown={(event) => startResize(event, handle)}
            />
          ))}
        </div>
      )}

      {/*
      A ring around the photo's own edge, not the crop frame's -- the frame
      is often a smaller rectangle somewhere inside the picture, and turning
      the photo is a property of the photo, not of whatever is currently
      selected out of it. Direct siblings of -frame rather than children of
      it, positioned against -stage (also `position: relative`) instead.
      Corners and edge midpoints alike, so the whole perimeter answers to a
      drag, not just four points on it -- there is no icon marking any of
      it; the cursor itself is the only cue, and it turns to match whichever
      of the eight this point is (see &-rotate-zone in styles.scss).
      Sits underneath -handle wherever a corner of the two happens to land
      on the same point -- a crop that already spans the whole image -- so
      the resize handle still wins there and only the rest of the ring
      falls through to rotate.
      */}
      {framed &&
        ROTATE_ZONES.map((point) => (
          <button
            key={`rotate-${point}`}
            type="button"
            className={cx(
              `${CLASSNAME}-rotate-zone`,
              `${CLASSNAME}-rotate-zone-${point}`,
              { [`${CLASSNAME}-rotate-zone-active`]: rotating },
            )}
            aria-label={`Rotate the image from its ${ROTATE_ZONE_NAME[point]}`}
            onPointerDown={startRotate}
          />
        ))}
    </>
  );

  return (
    <div className={cx(CLASSNAME, { [`${CLASSNAME}-fill`]: fill })}>
      {fill ? (
        <div className={`${CLASSNAME}-frame-area`} ref={measureFrameArea}>
          <div
            className={`${CLASSNAME}-stage`}
            ref={stage}
            style={{
              left: `${(fitted?.x ?? 0) * 100}%`,
              top: `${(fitted?.y ?? 0) * 100}%`,
              width: `${(fitted?.width ?? 1) * 100}%`,
              height: `${(fitted?.height ?? 1) * 100}%`,
              visibility: frameAreaAspect === undefined ? "hidden" : undefined,
            }}
          >
            {stageContent}
          </div>
        </div>
      ) : (
        <div
          className={`${CLASSNAME}-stage`}
          ref={stage}
          style={{
            aspectRatio: `${rotated.width} / ${rotated.height}`,
            maxWidth: `calc(var(--stage-max-height) * ${rotated.width / rotated.height})`,
          }}
        >
          {stageContent}
        </div>
      )}

      {!hideControls && (
        <>
          <EditorCard className={`${CLASSNAME}-status`}>
            <p
              className={`${CLASSNAME}-hint`}
              style={framed ? undefined : { visibility: "hidden" }}
            >
              <Icon icon={faCircleInfo} className={`${CLASSNAME}-hint-icon`} />
              Hold{" "}
              {guides.length > 0 && (
                <>
                  <kbd>Shift</kbd> to resize around the guides, or{" "}
                </>
              )}
              <kbd>{SUSPEND_KEY}</kbd> to size freely.
            </p>

            <p
              className={cx(`${CLASSNAME}-size`, {
                // Resizing pulls the frame onto round dimensions when it comes
                // close. Marking the moment it lands is what makes that legible:
                // an unannounced pull of a few pixels reads as the frame
                // disobeying rather than as the tool helping
                [`${CLASSNAME}-size-round`]: isRoundSize(
                  output.width,
                  output.height,
                ),
              })}
              title="Size of the finished image"
            >
              {value.angle !== 0 && "≈ "}
              {output.width} × {output.height} px
            </p>
          </EditorCard>

          {framed && (
            <EditorCard
              className={`${CLASSNAME}-rotate`}
              heading="Rotate tool"
              icon={faRotate}
            >
              <div className={`${CLASSNAME}-rotate-head`}>
                <span>Drag the edge of the photo to straighten it.</span>
                <Button
                  variant="link"
                  className={`${CLASSNAME}-angle`}
                  disabled={value.angle === 0}
                  onClick={() => setAngle(0)}
                  title="Reset rotation"
                >
                  {value.angle.toFixed(1)}°
                </Button>
              </div>
            </EditorCard>
          )}
        </>
      )}
    </div>
  );
};

export default CropFrame;
