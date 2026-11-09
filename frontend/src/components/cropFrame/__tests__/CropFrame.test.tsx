import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  type CropGuide,
  CropGuideAxisEnum,
  CropGuideRoleEnum,
} from "src/graphql";
import { describe, expect, it, vi } from "vitest";

import CropFrame from "../CropFrame";
import { type CropRect, FULL_FRAME } from "../geometry";

const SERVER_MAX_ANGLE = 90;

const setup = (
  value: CropRect = FULL_FRAME,
  onChange = vi.fn(),
  templated = true,
) => {
  const utils = render(
    <CropFrame
      src="blob:stub"
      naturalWidth={200}
      naturalHeight={300}
      aspectRatio={templated ? 2 / 3 : undefined}
      value={value}
      onChange={onChange}
    />,
  );
  return { ...utils, onChange, user: userEvent.setup() };
};

describe("CropFrame rotation", () => {
  // Turning reshapes the stage, so the frame is refitted rather than left
  // hanging outside the image. A quarter turn of a 200x300 picture makes it
  // 300x200, which a full-frame crop cannot survive unchanged
  it("refits the frame when the angle changes", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        value={FULL_FRAME}
        onChange={onChange}
      />,
    );
    rerender(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        value={{ ...FULL_FRAME, angle: 90 }}
        onChange={onChange}
      />,
    );

    // The stage follows the rotated bounding box, so a portrait picture turned
    // a quarter turn presents a landscape one to crop from
    //
    // Compared as a number, not a string: cos(90°) is not exactly zero in
    // floating point, so the height comes out as 200.00000000000003. Correct
    // to fourteen figures and invisible at any screen size
    const stage = document.querySelector(".CropFrame-stage") as HTMLElement;
    const [width, height] = stage.style.aspectRatio.split("/").map(Number);
    expect(width / height).toBeCloseTo(300 / 200);
  });
});

/**
 * Straightening by dragging a corner of the photo, not the crop frame:
 * neither one turns on screen, so what is being dragged around is the
 * stage's own (screen-fixed) centre. The angle is however far the pointer
 * has swept around it since the press, not the pointer's raw position
 */
describe("CropFrame rotate handles", () => {
  const dragRotate = (toX: number, toY: number) => {
    const onChange = vi.fn();
    render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        value={FULL_FRAME}
        onChange={onChange}
      />,
    );

    // jsdom measures everything as zero and the drag needs a box to work
    // against or it declines to start
    // A 400x600 stage puts the full-frame crop's centre at (200, 300)
    const stage = document.querySelector(".CropFrame-stage") as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({ width: 400, height: 600, left: 0, top: 0 }) as DOMRect;

    const handle = screen.getByRole("button", {
      name: "Rotate the image from its bottom-right corner",
    });
    // Directly right of centre: angle 0, the same for every corner's zone
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 400, clientY: 300 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: toX, clientY: toY });

    return onChange;
  };

  it("turns the image by however far the pointer swept around the centre", () => {
    // Down and to the right of centre: an eighth of a turn
    const onChange = dragRotate(300, 400);
    const angle = (onChange.mock.calls.at(-1)?.[0] as CropRect).angle;
    expect(angle).toBeCloseTo(45);
  });

  it("clamps to the server's limit past a quarter turn", () => {
    // Up and to the left of centre: more than a quarter turn from where the drag started
    const onChange = dragRotate(100, 150);
    const angle = (onChange.mock.calls.at(-1)?.[0] as CropRect).angle;
    expect(angle).toBe(-SERVER_MAX_ANGLE);
  });

  it("offers nothing to drag without a template", () => {
    setup(FULL_FRAME, vi.fn(), false);
    expect(
      screen.queryByRole("button", { name: /Rotate the image/ }),
    ).toBeNull();
  });

  it("pivots around the photo's centre, not an off-centre crop frame's", () => {
    const onChange = vi.fn();
    render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        value={{ x: 0.2, y: 0.2, width: 0.3, height: 0.3, angle: 0 }}
        onChange={onChange}
      />,
    );

    // 400x600 stage: its centre is (200, 300), well away from the small
    // frame's own centre at fraction (0.35, 0.35) -- pixel (140, 210)
    const stage = document.querySelector(".CropFrame-stage") as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({ width: 400, height: 600, left: 0, top: 0 }) as DOMRect;

    const handle = screen.getByRole("button", {
      name: "Rotate the image from its bottom-right corner",
    });
    // Directly right of the stage's centre, then straight down from it:
    // a clean quarter turn if (and only if) the stage's centre is the pivot
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 400, clientY: 300 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 200, clientY: 500 });

    const angle = (onChange.mock.calls.at(-1)?.[0] as CropRect).angle;
    expect(angle).toBeCloseTo(90);
  });
});

describe("CropFrame corner resize", () => {
  const FACE: CropGuide[] = [
    {
      __typename: "CropGuide" as const,
      axis: CropGuideAxisEnum.Y,
      position: 0.425,
      role: CropGuideRoleEnum.REFERENCE,
      label: "Bisects the eyes",
    },
  ];

  const dragCorner = () => {
    const onChange = vi.fn();
    const start: CropRect = {
      x: 0.2,
      y: 0.2,
      width: 0.5,
      height: 0.5,
      angle: 0,
    };

    render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        guides={FACE}
        value={start}
        onChange={onChange}
      />,
    );

    // jsdom measures everything as zero and the drag needs a box to work against or it declines to start
    const stage = document.querySelector(".CropFrame-stage") as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({ width: 400, height: 600, left: 0, top: 0 }) as DOMRect;

    const handle = screen.getByRole("button", { name: "Resize se" });
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 });
    // Both axes: the frame is shape-locked so the width leads and a purely vertical drag correctly changes nothing
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 80, clientY: 120 });

    return { onChange, start };
  };

  // I2 at the component level: the guides are drawn on the frame and travel
  // with it, so a resize moves every line but the anchored corner.
  const EYES = [
    {
      __typename: "CropGuide" as const,
      axis: CropGuideAxisEnum.Y,
      position: 0.01,
      role: CropGuideRoleEnum.ANCHOR,
      label: "Top of the hair",
    },
    {
      __typename: "CropGuide" as const,
      axis: CropGuideAxisEnum.Y,
      position: 0.4,
      role: CropGuideRoleEnum.ANCHOR,
      label: "Bisects the eyes",
    },
  ];

  const dragCornerWithShift = (shiftKey: boolean) => {
    const onChange = vi.fn();
    const start: CropRect = {
      x: 0.2,
      y: 0.2,
      width: 0.4,
      height: 0.4,
      angle: 0,
    };
    render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        guides={EYES}
        value={start}
        onChange={onChange}
      />,
    );
    const stage = document.querySelector(".CropFrame-stage") as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({ width: 400, height: 600, left: 0, top: 0 }) as DOMRect;
    const handle = screen.getByRole("button", { name: "Resize se" });
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(handle, {
      pointerId: 1,
      clientX: 80,
      clientY: 120,
      shiftKey,
    });
    const resized = onChange.mock.calls.at(-1)?.[0] as CropRect;
    return { start, resized };
  };

  it("keeps the red line in place while resizing with Shift", () => {
    const { start, resized } = dragCornerWithShift(true);
    expect(resized.height).toBeGreaterThan(start.height);
    expect(resized.y + resized.height * 0.4).toBeCloseTo(
      start.y + start.height * 0.4,
    );
  });

  it("lets the red line move with a plain resize", () => {
    const { start, resized } = dragCornerWithShift(false);
    expect(resized.y).toBeCloseTo(start.y);
    expect(resized.y + resized.height * 0.4).not.toBeCloseTo(
      start.y + start.height * 0.4,
    );
  });

  it("anchors the corner opposite the handle", () => {
    const { onChange, start } = dragCorner();

    expect(onChange).toHaveBeenCalled();
    const resized = onChange.mock.calls.at(-1)?.[0] as CropRect;
    expect(resized.height).toBeGreaterThan(start.height);
    expect(resized.x).toBeCloseTo(start.x);
    expect(resized.y).toBeCloseTo(start.y);
  });

  it("holds Shift for nothing: it resizes the same either way", () => {
    const { onChange } = dragCorner();
    const plain = onChange.mock.calls.at(-1)?.[0] as CropRect;

    const withShift = vi.fn();
    render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        guides={FACE}
        value={{ x: 0.2, y: 0.2, width: 0.5, height: 0.5, angle: 0 }}
        onChange={withShift}
      />,
    );
    const stage = document.querySelectorAll(
      ".CropFrame-stage",
    )[1] as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({ width: 400, height: 600, left: 0, top: 0 }) as DOMRect;
    const handle = screen.getAllByRole("button", { name: "Resize se" })[1];
    fireEvent.pointerDown(handle, {
      pointerId: 2,
      clientX: 0,
      clientY: 0,
      shiftKey: true,
    });
    fireEvent.pointerMove(handle, { pointerId: 2, clientX: 80, clientY: 120 });

    expect(withShift.mock.calls.at(-1)?.[0]).toEqual(plain);
  });
});

describe("CropFrame zoom", () => {
  // The stage carries every percentage the drag math measures against, so
  // zoom must scale the stage itself -- not transform its contents -- for
  // the press-time box arithmetic to stay valid.
  it("scales the default-mode stage and uncaps its height", () => {
    const { container } = render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        value={FULL_FRAME}
        onChange={vi.fn()}
        zoom={2}
      />,
    );

    const stage = container.querySelector(".CropFrame-stage") as HTMLElement;
    expect(stage.style.width).toBe("200%");
    expect(stage.style.maxHeight).toBe("none");
    expect(container.querySelector(".CropFrame-scroll")).not.toBeNull();
  });

  it("scales the fill-mode canvas while the frame area keeps its size", () => {
    const { container } = render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        value={FULL_FRAME}
        onChange={vi.fn()}
        fill
        zoom={2.5}
      />,
    );

    const canvas = container.querySelector(".CropFrame-canvas") as HTMLElement;
    expect(canvas.style.width).toBe("250%");
    expect(canvas.style.height).toBe("250%");
  });

  it("zooms on Ctrl+wheel and scrolls on a plain wheel", () => {
    const onZoomChange = vi.fn();
    const { container } = render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        value={FULL_FRAME}
        onChange={vi.fn()}
        zoom={1}
        onZoomChange={onZoomChange}
      />,
    );

    const view = container.querySelector(".CropFrame-scroll") as HTMLElement;
    fireEvent.wheel(view, { deltaY: -1 });
    expect(onZoomChange).not.toHaveBeenCalled();

    fireEvent.wheel(view, { deltaY: -1, ctrlKey: true });
    expect(onZoomChange).toHaveBeenCalledWith(1.25);
  });
});

describe("CropFrame panning", () => {
  // jsdom lays nothing out, so the viewport and its content are described by
  // hand: a stage twice the viewport, which is what having zoomed in means.
  const zoomedIn = (onChange = vi.fn()) => {
    const { container } = render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        value={{ x: 0.4, y: 0.4, width: 0.2, height: 0.2, angle: 0 }}
        onChange={onChange}
        zoom={2}
        onZoomChange={vi.fn()}
      />,
    );

    const view = container.querySelector(".CropFrame-scroll") as HTMLElement;
    Object.defineProperties(view, {
      clientWidth: { value: 400, configurable: true },
      clientHeight: { value: 600, configurable: true },
    });
    const box = container.querySelector(".CropFrame-stage") as HTMLElement;
    Object.defineProperties(box, {
      offsetWidth: { value: 800, configurable: true },
      offsetHeight: { value: 1200, configurable: true },
    });
    view.setPointerCapture = vi.fn();
    view.releasePointerCapture = vi.fn();
    view.scrollLeft = 100;
    view.scrollTop = 100;
    return view;
  };

  // The stage is what can be panned over; the viewport's own scroll extent
  // is wider by the handles' overhang and would let the picture leave a gap
  it("stops at the stage's edge, not the viewport's scroll extent", () => {
    const view = zoomedIn();

    fireEvent.pointerDown(view, {
      pointerId: 1,
      button: 0,
      clientX: 50,
      clientY: 50,
    });
    fireEvent.pointerMove(view, { pointerId: 1, clientX: -900, clientY: -900 });

    expect(view.scrollLeft).toBe(400);
    expect(view.scrollTop).toBe(600);
  });

  it("scrolls the viewport against the drag", () => {
    const view = zoomedIn();

    fireEvent.pointerDown(view, {
      pointerId: 1,
      button: 0,
      clientX: 50,
      clientY: 50,
    });
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 30, clientY: 20 });

    // Against, not with: dragging the picture left shows what is to its right
    expect(view.scrollLeft).toBe(120);
    expect(view.scrollTop).toBe(130);
  });

  it("measures from the press, so a drag back returns where it started", () => {
    const view = zoomedIn();

    fireEvent.pointerDown(view, {
      pointerId: 1,
      button: 0,
      clientX: 50,
      clientY: 50,
    });
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 50, clientY: 50 });

    expect(view.scrollLeft).toBe(100);
    expect(view.scrollTop).toBe(100);
  });

  it("stops when the pointer is released", () => {
    const view = zoomedIn();

    fireEvent.pointerDown(view, {
      pointerId: 1,
      button: 0,
      clientX: 50,
      clientY: 50,
    });
    fireEvent.pointerUp(view, { pointerId: 1 });
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 0, clientY: 0 });

    expect(view.scrollLeft).toBe(100);
  });

  // The press reaches this handler before React sees it, so staying out of
  // the crop gestures' way cannot rely on their stopPropagation.
  it("leaves a press on the frame to the crop gesture", () => {
    const view = zoomedIn();
    const handle = screen.getByRole("button", { name: "Resize se" });

    fireEvent.pointerDown(handle, {
      pointerId: 1,
      button: 0,
      clientX: 50,
      clientY: 50,
    });
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 0, clientY: 0 });

    expect(view.scrollLeft).toBe(100);
  });

  it("does nothing when there is nothing to pan to", () => {
    const { container } = render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        value={{ x: 0.4, y: 0.4, width: 0.2, height: 0.2, angle: 0 }}
        onChange={vi.fn()}
      />,
    );
    const view = container.querySelector(".CropFrame-scroll") as HTMLElement;
    Object.defineProperties(view, {
      clientWidth: { value: 400, configurable: true },
      clientHeight: { value: 600, configurable: true },
      // Wider than the stage by the handles' overhang: not room to pan
      scrollWidth: { value: 414, configurable: true },
      scrollHeight: { value: 614, configurable: true },
    });
    const box = container.querySelector(".CropFrame-stage") as HTMLElement;
    Object.defineProperties(box, {
      offsetWidth: { value: 400, configurable: true },
      offsetHeight: { value: 600, configurable: true },
    });
    view.setPointerCapture = vi.fn();
    view.scrollLeft = 0;

    fireEvent.pointerDown(view, {
      pointerId: 1,
      button: 0,
      clientX: 50,
      clientY: 50,
    });
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 0, clientY: 0 });

    expect(view.scrollLeft).toBe(0);
    expect(view.className).not.toContain("CropFrame-pannable");
  });
});

describe("CropFrame without a template", () => {
  it("draws no frame at all", () => {
    setup(FULL_FRAME, vi.fn(), false);

    expect(document.querySelector(".CropFrame-frame")).toBeNull();
    expect(document.querySelector(".CropFrame-shade")).toBeNull();
    expect(screen.queryByRole("button", { name: "Resize se" })).toBeNull();
  });

  it("does not offer the rotation control", () => {
    setup(FULL_FRAME, vi.fn(), false);
    expect(document.querySelector(".CropFrame-rotate")).toBeNull();
  });
});
