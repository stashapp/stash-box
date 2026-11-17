import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import {
  type CropGuide,
  CropGuideAxisEnum,
  CropGuideRoleEnum,
} from "src/graphql";
import { describe, expect, it, vi } from "vitest";

import CropFrame from "../CropFrame";
import {
  type CropPin,
  type CropRect,
  FULL_FRAME,
  resizeRect,
} from "../geometry";

const guide = (
  position: number,
  role: CropGuideRoleEnum,
  label: string,
): CropGuide => ({
  __typename: "CropGuide",
  axis: CropGuideAxisEnum.Y,
  position,
  role,
  label,
});

const REFERENCE_ONLY = [
  guide(0.425, CropGuideRoleEnum.REFERENCE, "Bisects the eyes"),
];
const EYES = [
  guide(0.01, CropGuideRoleEnum.ANCHOR, "Top of the hair"),
  guide(0.4, CropGuideRoleEnum.ANCHOR, "Bisects the eyes"),
];

const setup = (extra: Partial<ComponentProps<typeof CropFrame>> = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <CropFrame
      src="blob:stub"
      naturalWidth={200}
      naturalHeight={300}
      aspectRatio={2 / 3}
      value={FULL_FRAME}
      onChange={onChange}
      {...extra}
    />,
  );

  // jsdom measures everything as zero; a 400x600 stage puts the centre at (200, 300)
  const drag = (
    name: string,
    from: [number, number],
    to: [number, number],
    init: { shiftKey?: boolean } = {},
  ) => {
    const stage = utils.container.querySelector(
      ".CropFrame-stage",
    ) as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({ width: 400, height: 600, left: 0, top: 0 }) as DOMRect;
    const handle = within(utils.container).getByRole("button", { name });
    fireEvent.pointerDown(handle, {
      pointerId: 1,
      clientX: from[0],
      clientY: from[1],
    });
    fireEvent.pointerMove(handle, {
      pointerId: 1,
      clientX: to[0],
      clientY: to[1],
      ...init,
    });
    return onChange.mock.calls.at(-1)?.[0] as CropRect;
  };

  return { ...utils, onChange, drag };
};

describe("CropFrame rotation", () => {
  it("presents the turned image's bounding box as the stage", () => {
    const { container } = setup({ value: { ...FULL_FRAME, angle: 90 } });

    const stage = container.querySelector(".CropFrame-stage") as HTMLElement;
    const [width, height] = stage.style.aspectRatio.split("/").map(Number);
    expect(width / height).toBeCloseTo(300 / 200);
  });
});

describe("CropFrame rotate handles", () => {
  const corner = "Rotate the image from its bottom-right corner";

  it("turns the image by however far the pointer swept around the centre", () => {
    const { drag } = setup();
    expect(drag(corner, [400, 300], [300, 400]).angle).toBeCloseTo(45);
  });

  it("clamps to the server's limit past a quarter turn", () => {
    const { drag } = setup();
    expect(drag(corner, [400, 300], [100, 150]).angle).toBe(-90);
  });

  it("pivots around the photo's centre, not an off-centre crop frame's", () => {
    const { drag } = setup({
      value: { x: 0.2, y: 0.2, width: 0.3, height: 0.3, angle: 0 },
    });
    expect(drag(corner, [400, 300], [200, 500]).angle).toBeCloseTo(90);
  });
});

describe("CropFrame corner resize", () => {
  const start: CropRect = { x: 0.2, y: 0.2, width: 0.4, height: 0.4, angle: 0 };
  const resized = (pin?: CropPin) =>
    resizeRect({
      rect: start,
      handle: "se",
      dx: 0.2,
      dy: 0.2,
      targetAspect: 2 / 3,
      imageAspect: 2 / 3,
      pin,
    });

  it("anchors the corner opposite the handle", () => {
    const { drag } = setup({ value: start, guides: REFERENCE_ONLY });
    expect(drag("Resize se", [0, 0], [80, 120])).toEqual(resized());
  });

  it("pins the primary anchor's line while resizing with Shift", () => {
    const { drag } = setup({ value: start, guides: EYES });
    expect(drag("Resize se", [0, 0], [80, 120], { shiftKey: true })).toEqual(
      resized({ axis: "y", position: 0.4 }),
    );
  });

  it("lets the line move with a plain resize", () => {
    const { drag } = setup({ value: start, guides: EYES });
    expect(drag("Resize se", [0, 0], [80, 120])).toEqual(resized());
  });

  it("holds Shift for nothing without an anchor to pin", () => {
    const { drag } = setup({ value: start, guides: REFERENCE_ONLY });
    expect(drag("Resize se", [0, 0], [80, 120], { shiftKey: true })).toEqual(
      resized(),
    );
  });
});

describe("CropFrame zoom", () => {
  it("scales the default-mode stage and uncaps its height", () => {
    const { container } = setup({ zoom: 2 });

    const stage = container.querySelector(".CropFrame-stage") as HTMLElement;
    expect(stage.style.width).toBe("200%");
    expect(stage.style.maxHeight).toBe("none");
    expect(container.querySelector(".CropFrame-scroll")).not.toBeNull();
  });

  it("scales the fill-mode canvas while the frame area keeps its size", () => {
    const { container } = setup({ fill: true, zoom: 2.5 });

    const canvas = container.querySelector(".CropFrame-canvas") as HTMLElement;
    expect(canvas.style.width).toBe("250%");
    expect(canvas.style.height).toBe("250%");
  });

  it("zooms on Ctrl+wheel and scrolls on a plain wheel", () => {
    const onZoomChange = vi.fn();
    const { container } = setup({ zoom: 1, onZoomChange });

    const view = container.querySelector(".CropFrame-scroll") as HTMLElement;
    fireEvent.wheel(view, { deltaY: -1 });
    expect(onZoomChange).not.toHaveBeenCalled();

    fireEvent.wheel(view, { deltaY: -1, ctrlKey: true });
    expect(onZoomChange).toHaveBeenCalledWith(1.25);
  });
});

describe("CropFrame panning", () => {
  // A viewport and a stage twice its size, which is what having zoomed in means
  const zoomedIn = (zoom = 2, stageSize = [800, 1200]) => {
    const { container } = setup({
      value: { x: 0.4, y: 0.4, width: 0.2, height: 0.2, angle: 0 },
      zoom,
      onZoomChange: vi.fn(),
    });

    const view = container.querySelector(".CropFrame-scroll") as HTMLElement;
    Object.defineProperties(view, {
      clientWidth: { value: 400, configurable: true },
      clientHeight: { value: 600, configurable: true },
    });
    const stage = container.querySelector(".CropFrame-stage") as HTMLElement;
    Object.defineProperties(stage, {
      offsetWidth: { value: stageSize[0], configurable: true },
      offsetHeight: { value: stageSize[1], configurable: true },
    });
    view.setPointerCapture = vi.fn();
    view.releasePointerCapture = vi.fn();
    view.scrollLeft = 100;
    view.scrollTop = 100;
    return view;
  };

  const press = (view: HTMLElement) =>
    fireEvent.pointerDown(view, {
      pointerId: 1,
      button: 0,
      clientX: 50,
      clientY: 50,
    });

  it("stops at the stage's edge, not the viewport's scroll extent", () => {
    const view = zoomedIn();

    press(view);
    fireEvent.pointerMove(view, { pointerId: 1, clientX: -900, clientY: -900 });

    expect(view.scrollLeft).toBe(400);
    expect(view.scrollTop).toBe(600);
  });

  it("scrolls the viewport against the drag", () => {
    const view = zoomedIn();

    press(view);
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 30, clientY: 20 });

    expect(view.scrollLeft).toBe(120);
    expect(view.scrollTop).toBe(130);
  });

  it("measures from the press, so a drag back returns where it started", () => {
    const view = zoomedIn();

    press(view);
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 50, clientY: 50 });

    expect(view.scrollLeft).toBe(100);
    expect(view.scrollTop).toBe(100);
  });

  it("stops when the pointer is released", () => {
    const view = zoomedIn();

    press(view);
    fireEvent.pointerUp(view, { pointerId: 1 });
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 0, clientY: 0 });

    expect(view.scrollLeft).toBe(100);
  });

  it("leaves a press on the frame to the crop gesture", () => {
    const view = zoomedIn();

    press(screen.getByRole("button", { name: "Resize se" }));
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 0, clientY: 0 });

    expect(view.scrollLeft).toBe(100);
  });

  it("does nothing when there is nothing to pan to", () => {
    const view = zoomedIn(1, [400, 600]);
    view.scrollLeft = 0;

    press(view);
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 0, clientY: 0 });

    expect(view.scrollLeft).toBe(0);
    expect(view.className).not.toContain("CropFrame-pannable");
  });
});

describe("CropFrame without a template", () => {
  it("draws nothing to drag", () => {
    setup({ aspectRatio: undefined });

    expect(document.querySelector(".CropFrame-frame")).toBeNull();
    expect(document.querySelector(".CropFrame-shade")).toBeNull();
    expect(screen.queryByRole("button", { name: /Resize|Rotate/ })).toBeNull();
  });
});
