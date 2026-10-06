import cx from "classnames";
import {
  type FC,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type CropGuide, CropGuideAxisEnum } from "src/graphql";
import { useMeasuredAspect } from "src/hooks";

import CropOverlay, { primaryAnchors } from "./CropOverlay";
import {
  type CropPin,
  type CropRect,
  type Handle,
  largestCenteredRect,
  moveRect,
  refitRect,
  resizeRect,
  rotatedSize,
} from "./geometry";
import { stepZoom, zoomCeiling } from "./zoom";

const CLASSNAME = "CropFrame";

const panRoom = (view: HTMLElement, box: HTMLElement) => ({
  left: Math.max(0, box.offsetLeft + box.offsetWidth - view.clientWidth),
  top: Math.max(0, box.offsetTop + box.offsetHeight - view.clientHeight),
});
const HANDLES: Handle[] = ["nw", "ne", "sw", "se"];
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

const angleTo = (
  origin: { x: number; y: number },
  point: { x: number; y: number },
) => (Math.atan2(point.y - origin.y, point.x - origin.x) * 180) / Math.PI;

const angleDelta = (from: number, to: number) =>
  ((((to - from + 180) % 360) + 360) % 360) - 180;

interface CropFrameProps {
  // Object URL of the image being cropped
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  /** Width over height to lock the frame to, or undefined to drag freely */
  aspectRatio?: number;
  guides?: CropGuide[];
  value: CropRect;
  onChange: (rect: CropRect) => void;
  fill?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onZoomCeilingChange?: (ceiling: number) => void;
}

const CropFrame: FC<CropFrameProps> = ({
  src,
  naturalWidth,
  naturalHeight,
  aspectRatio,
  guides = [],
  value,
  onChange,
  fill = false,
  zoom = 1,
  onZoomChange,
  onZoomCeilingChange,
}) => {
  const stage = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [panning, setPanning] = useState(false);
  const [rotating, setRotating] = useState(false);

  // Only measured in fill mode: the default width-first fit needs no
  // measurement, it is derived entirely from the image's own aspect ratio
  const { ref: measureFrameArea, aspect: frameAreaAspect } =
    useMeasuredAspect();
  // Zooming re-lays-out the stage, so without help the view would stay
  // anchored to the top-left corner and the frame would wander offscreen.
  // Re-centring on the frame keeps the thing being worked on under the
  // hand. Deliberately keyed on zoom alone: recentring on every drag of the
  // frame would fight the pointer.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on zoom alone by design
  useLayoutEffect(() => {
    const view = scroll.current;
    const box = stage.current;
    if (!view || !box) return;
    const centreX =
      box.offsetLeft + (value.x + value.width / 2) * box.offsetWidth;
    const centreY =
      box.offsetTop + (value.y + value.height / 2) * box.offsetHeight;
    const room = panRoom(view, box);
    view.scrollLeft = Math.min(centreX - view.clientWidth / 2, room.left);
    view.scrollTop = Math.min(centreY - view.clientHeight / 2, room.top);
  }, [zoom]);

  const reported = useRef<number>();
  useLayoutEffect(() => {
    const view = scroll.current;
    const box = stage.current;
    if (!view || !box) return;

    const ceiling = zoomCeiling(
      zoom,
      {
        width: value.width * box.offsetWidth,
        height: value.height * box.offsetHeight,
      },
      { width: view.clientWidth, height: view.clientHeight },
    );

    // A hair of tolerance: the measurement is in whole pixels and the zoom is
    // not, so an exact comparison would find a fresh violation every render
    // and hand the two of them a loop to sit in
    if (onZoomChange && zoom > ceiling * 1.005) onZoomChange(ceiling);

    if (onZoomCeilingChange && reported.current !== ceiling) {
      reported.current = ceiling;
      onZoomCeilingChange(ceiling);
    }
  }, [zoom, value.width, value.height, onZoomChange, onZoomCeilingChange]);

  // Click-to-drag panning, once there is more picture than viewport
  useEffect(() => {
    const view = scroll.current;
    if (!view) return;

    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if ((event.target as Element | null)?.closest("button")) return;
      const box = stage.current;
      if (!box) return;
      // Measured rather than inferred from the zoom: fill mode can overflow
      // on one axis at a zoom the other has room to spare at
      const room = panRoom(view, box);
      if (room.left < 1 && room.top < 1) return;

      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const fromLeft = view.scrollLeft;
      const fromTop = view.scrollTop;
      view.setPointerCapture(event.pointerId);
      setPanning(true);

      // From the press rather than the last move, the same as every other drag here:
      // scrollLeft saturates at the ends, so accumulating per-move deltas would lose
      // whatever the clamp ate and leave the picture drifting behind the hand
      const move = (moveEvent: PointerEvent) => {
        view.scrollLeft = Math.min(
          Math.max(0, fromLeft - (moveEvent.clientX - startX)),
          room.left,
        );
        view.scrollTop = Math.min(
          Math.max(0, fromTop - (moveEvent.clientY - startY)),
          room.top,
        );
      };

      const done = () => {
        view.releasePointerCapture(event.pointerId);
        view.removeEventListener("pointermove", move);
        view.removeEventListener("pointerup", done);
        view.removeEventListener("pointercancel", done);
        setPanning(false);
      };

      view.addEventListener("pointermove", move);
      view.addEventListener("pointerup", done);
      view.addEventListener("pointercancel", done);
    };

    view.addEventListener("pointerdown", down);
    return () => view.removeEventListener("pointerdown", down);
  }, []);

  // Ctrl/Cmd + wheel zooms. A native non-passive listener
  // because preventDefault in React's delegated wheel handler is ignored,
  // and without it the browser zooms the whole page
  useEffect(() => {
    const view = scroll.current;
    if (!view || !onZoomChange) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      onZoomChange(stepZoom(zoom, event.deltaY < 0 ? 1 : -1));
    };
    view.addEventListener("wheel", wheel, { passive: false });
    return () => view.removeEventListener("wheel", wheel);
  }, [zoom, onZoomChange]);

  // The stage is the rotated image's bounding box, which is what the frame's
  // fractions are measured against. Rotation grows it, matching what the
  // server does, so the frame the contributor drags is the frame that gets cut
  const rotated = rotatedSize(naturalWidth, naturalHeight, value.angle);
  const imageAspect = rotated.width / rotated.height;

  const drag = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      apply: (dx: number, dy: number, shift: boolean) => CropRect,
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
            moveEvent.shiftKey,
          ),
        );
      };

      const done = () => {
        target.releasePointerCapture(event.pointerId);
        target.removeEventListener("pointermove", move);
        target.removeEventListener("pointerup", done);
        target.removeEventListener("pointercancel", done);
        setDragging(false);
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

  const pin = useMemo((): CropPin | undefined => {
    const anchors = [...primaryAnchors(guides)];
    const guide =
      anchors.find((g) => g.axis === CropGuideAxisEnum.Y) ?? anchors[0];
    return guide
      ? {
          axis: guide.axis === CropGuideAxisEnum.Y ? "y" : "x",
          position: guide.position,
        }
      : undefined;
  }, [guides]);

  // The viewport clips labels past the stage's edge; unmeasured counts as roomy
  const startResize = (
    event: ReactPointerEvent<HTMLElement>,
    handle: Handle,
  ) => {
    const from = value;

    drag(event, (dx, dy, shift) =>
      resizeRect({
        rect: from,
        handle,
        dx,
        dy,
        targetAspect: aspectRatio,
        imageAspect,
        pin: shift ? pin : undefined,
      }),
    );
  };

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
          <CropOverlay guides={guides} pinHint />

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
        <div
          className={cx(`${CLASSNAME}-frame-area`, {
            [`${CLASSNAME}-pannable`]: zoom > 1,
            [`${CLASSNAME}-panning`]: panning,
          })}
          ref={(element) => {
            measureFrameArea(element);
            scroll.current = element;
          }}
        >
          <div
            className={`${CLASSNAME}-canvas`}
            style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
          >
            <div
              className={`${CLASSNAME}-stage`}
              ref={stage}
              style={{
                left: `${(fitted?.x ?? 0) * 100}%`,
                top: `${(fitted?.y ?? 0) * 100}%`,
                width: `${(fitted?.width ?? 1) * 100}%`,
                height: `${(fitted?.height ?? 1) * 100}%`,
                visibility:
                  frameAreaAspect === undefined ? "hidden" : undefined,
              }}
            >
              {stageContent}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cx(`${CLASSNAME}-scroll`, {
            [`${CLASSNAME}-pannable`]: zoom > 1,
            [`${CLASSNAME}-panning`]: panning,
          })}
          ref={scroll}
        >
          <div
            className={`${CLASSNAME}-stage`}
            ref={stage}
            style={{
              aspectRatio: `${rotated.width} / ${rotated.height}`,
              width: `${zoom * 100}%`,
              maxWidth: `calc(var(--stage-max-height) * ${rotated.width / rotated.height} * ${zoom})`,
              // The height cap belongs to the viewport once it scrolls;
              // left on the stage it would squash the zoomed picture
              maxHeight: zoom > 1 ? "none" : undefined,
            }}
          >
            {stageContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default CropFrame;
