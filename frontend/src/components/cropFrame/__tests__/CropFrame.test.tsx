import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FC } from "react";
import { useState } from "react";
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
  // A quarter turn covers the picture taken sideways; a tenth of a degree
  // covers the horizon that is barely out. The step is what arrow keys move
  // by, so it has to stay fine even though the range is wide
  it("shows the current angle", () => {
    setup({ ...FULL_FRAME, angle: 12.5 });
    expect(screen.getByRole("button", { name: /12\.5°/ })).toBeInTheDocument();
  });

  it("returns to zero when the readout is clicked", async () => {
    const { onChange, user } = setup({ ...FULL_FRAME, angle: 37 });

    await user.click(screen.getByRole("button", { name: /37\.0°/ }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ angle: 0 });
  });

  it("offers nothing to reset when already straight", () => {
    setup({ ...FULL_FRAME, angle: 0 });
    expect(screen.getByRole("button", { name: /0\.0°/ })).toBeDisabled();
  });

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
 * stage's own (screen-fixed) centre. The angle is however far the
 * pointer has swept around it since the press, not the pointer's raw
 * position
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

describe("CropFrame shift-resize", () => {
  const FACE: CropGuide[] = [
    {
      __typename: "CropGuide" as const,
      axis: CropGuideAxisEnum.Y,
      position: 0.425,
      role: CropGuideRoleEnum.REFERENCE,
      label: "Bisects the eyes",
      pivot: true,
    },
  ];

  const dragCorner = (shiftKey: boolean) => {
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
    fireEvent.pointerDown(handle, {
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      shiftKey,
    });
    // Both axes: the frame is shape-locked so the width leads and a purely vertical drag correctly changes nothing
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 80, clientY: 120 });

    return { onChange, start };
  };

  const eyeLineOn = (rect: CropRect) => rect.y + 0.425 * rect.height;

  it("keeps the eye line still when Shift is held", () => {
    const { onChange, start } = dragCorner(true);

    expect(onChange).toHaveBeenCalled();
    const resized = onChange.mock.calls.at(-1)?.[0] as CropRect;
    expect(resized.height).toBeGreaterThan(start.height);
    expect(eyeLineOn(resized)).toBeCloseTo(eyeLineOn(start));
  });

  it("anchors the opposite corner without it", () => {
    const { onChange, start } = dragCorner(false);

    const resized = onChange.mock.calls.at(-1)?.[0] as CropRect;
    expect(resized.height).toBeGreaterThan(start.height);
    expect(resized.y).toBeCloseTo(start.y);
    expect(eyeLineOn(resized)).not.toBeCloseTo(eyeLineOn(start));
  });

  const renderFrame = () => {
    render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        guides={FACE}
        value={{ x: 0.2, y: 0.2, width: 0.5, height: 0.5, angle: 0 }}
        onChange={vi.fn()}
      />,
    );
  };

  const marked = () =>
    document.querySelectorAll(".CropOverlay-guide-held").length;

  it("marks nothing until Shift is down", () => {
    renderFrame();
    expect(marked()).toBe(0);
  });

  it("marks the line a resize would turn about while Shift is down", () => {
    renderFrame();

    fireEvent.keyDown(window, { key: "Shift", shiftKey: true });
    expect(marked()).toBe(1);

    fireEvent.keyUp(window, { key: "Shift", shiftKey: false });
    expect(marked()).toBe(0);
  });

  it("stops marking when the window loses focus", () => {
    renderFrame();

    fireEvent.keyDown(window, { key: "Shift", shiftKey: true });
    expect(marked()).toBe(1);

    fireEvent.blur(window);
    expect(marked()).toBe(0);
  });

  it("does not start marking mid-drag", () => {
    const onChange = vi.fn();
    render(
      <CropFrame
        src="blob:stub"
        naturalWidth={200}
        naturalHeight={300}
        aspectRatio={2 / 3}
        guides={FACE}
        value={{ x: 0.2, y: 0.2, width: 0.5, height: 0.5, angle: 0 }}
        onChange={onChange}
      />,
    );

    const stage = document.querySelector(".CropFrame-stage") as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({ width: 400, height: 600, left: 0, top: 0 }) as DOMRect;

    const handle = screen.getByRole("button", { name: "Resize se" });
    fireEvent.pointerDown(handle, {
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      shiftKey: false,
    });

    fireEvent.keyDown(window, { key: "Shift", shiftKey: true });
    expect(marked()).toBe(0);
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

describe("CropFrame size readout", () => {
  const readout = () =>
    document.querySelector(".CropFrame-size")?.textContent ?? "";

  it("measures the frame, not the file", () => {
    setup(FULL_FRAME);
    expect(readout()).toBe("200 × 300 px");
  });

  it("follows the frame as it shrinks", () => {
    setup({ x: 0.25, y: 0.25, width: 0.5, height: 0.5, angle: 0 });
    expect(readout()).toBe("100 × 150 px");
  });

  it("admits to being approximate once turned, and only then", () => {
    setup({ ...FULL_FRAME, angle: 10 });
    expect(readout()).toMatch(/^≈ /);

    cleanup();
    setup(FULL_FRAME);
    expect(readout()).not.toMatch(/^≈ /);
  });

  it("is there without a template", () => {
    setup(FULL_FRAME, vi.fn(), false);
    expect(readout()).toBe("200 × 300 px");
  });
});

/**
 * That the snap reaches the readout, which is the seam between the arithmetic
 * and the thing anyone actually sees. Held in state so the drag, the snap and
 * the number form one loop, rather than checking the emitted rectangle and assuming the rest
 */
describe("CropFrame snapping to round sizes", () => {
  const Controlled: FC<{ start: CropRect }> = ({ start }) => {
    const [rect, setRect] = useState(start);
    return (
      <CropFrame
        src="blob:stub"
        naturalWidth={3000}
        naturalHeight={4500}
        aspectRatio={2 / 3}
        value={rect}
        onChange={setRect}
      />
    );
  };

  const dragTo = (clientX: number, modifiers: Record<string, boolean> = {}) => {
    render(<Controlled start={FULL_FRAME} />);

    // jsdom measures everything as zero, and the drag needs a box to work against or it declines to start
    const stage = document.querySelector(".CropFrame-stage") as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({ width: 400, height: 600, left: 0, top: 0 }) as DOMRect;

    const handle = screen.getByRole("button", { name: "Resize se" });
    fireEvent.pointerDown(handle, {
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      ...modifiers,
    });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX, clientY: 0 });

    return document.querySelector(".CropFrame-size") as HTMLElement;
  };

  // -264 of 400 is 0.66 of the frame, leaving 1020 of 3000 pixels: near enough
  // to 1000 that someone was plainly aiming at it
  it("lands the readout on a round size", () => {
    expect(dragTo(-264).textContent).toBe("1000 × 1500 px");
  });

  it("marks the readout once it lands", () => {
    expect(dragTo(-264).className).toContain("CropFrame-size-round");
  });

  // Two percent of the frame: further than that and the frame is not nearly right, it is somewhere else
  it("leaves the readout unmarked when the frame is between sizes", () => {
    const readout = dragTo(-261);
    expect(readout.textContent).not.toBe("1000 × 1500 px");
    expect(readout.className).not.toContain("CropFrame-size-round");
  });
});

/**
 * Snapping is on by default and a held key suspends it, which is how every
 * editor that has snapping works: Photoshop, Figma and Inkscape all snap
 * unless told not to
 *
 * Both Ctrl and Command count. Ctrl-clicking is a secondary click on macOS and
 * would never arrive here, so a Ctrl-only check would leave Mac users with no
 * way to switch snapping off at all
 */
describe("CropFrame suspending the snap", () => {
  const Controlled: FC<{ start: CropRect }> = ({ start }) => {
    const [rect, setRect] = useState(start);
    return (
      <CropFrame
        src="blob:stub"
        naturalWidth={3000}
        naturalHeight={4500}
        aspectRatio={2 / 3}
        value={rect}
        onChange={setRect}
      />
    );
  };

  const dragWith = (modifiers: Record<string, boolean>) => {
    render(<Controlled start={FULL_FRAME} />);

    const stage = document.querySelector(".CropFrame-stage") as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({ width: 400, height: 600, left: 0, top: 0 }) as DOMRect;

    const handle = screen.getByRole("button", { name: "Resize se" });
    fireEvent.pointerDown(handle, {
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      ...modifiers,
    });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: -264, clientY: 0 });

    return document.querySelector(".CropFrame-size")?.textContent ?? "";
  };

  // The same drag that lands on 1000 x 1500 unmodified
  it("snaps when nothing is held", () => {
    expect(dragWith({})).toBe("1000 × 1500 px");
  });

  it("does not snap while Ctrl is held", () => {
    expect(dragWith({ ctrlKey: true })).toBe("1020 × 1530 px");
  });

  it("does not snap while Command is held either", () => {
    expect(dragWith({ metaKey: true })).toBe("1020 × 1530 px");
  });

  // Shift already means something else here, and the two have to be
  // independently usable: holding a guide is not a request to stop snapping
  it("still snaps while Shift is held", () => {
    expect(dragWith({ shiftKey: true })).toBe("1000 × 1500 px");
  });
});
