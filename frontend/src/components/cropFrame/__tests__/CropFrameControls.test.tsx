import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import CropFrameControls from "../CropFrameControls";
import { FULL_FRAME } from "../geometry";
import { MAX_ZOOM } from "../zoom";

const renderControls = (
  extra: Partial<ComponentProps<typeof CropFrameControls>>,
) =>
  render(
    <CropFrameControls
      src="blob:stub"
      value={FULL_FRAME}
      onChange={vi.fn()}
      aspectRatio={2 / 3}
      naturalWidth={200}
      naturalHeight={300}
      {...extra}
    />,
  );

const setup = (zoom: number) => {
  const onZoomChange = vi.fn();
  render(
    <CropFrameControls
      src="blob:stub"
      value={FULL_FRAME}
      onChange={vi.fn()}
      aspectRatio={2 / 3}
      naturalWidth={200}
      naturalHeight={300}
      zoom={zoom}
      onZoomChange={onZoomChange}
    />,
  );
  return { onZoomChange, user: userEvent.setup() };
};

describe("CropFrameControls rotation reset", () => {
  it("shows the current angle and resets it", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderControls({ value: { ...FULL_FRAME, angle: 37 }, onChange });

    expect(screen.getByText("37.0°")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset rotation" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ angle: 0 });
  });

  it("offers nothing to reset when already straight", () => {
    renderControls({});
    expect(
      screen.getByRole("button", { name: "Reset rotation" }),
    ).toBeDisabled();
    expect(screen.queryByText("0.0°")).toBeNull();
  });
});

describe("CropFrameControls size readout", () => {
  const readout = () =>
    document.querySelector(".CropFrame-size")?.textContent ?? "";

  it("measures the frame, not the file", () => {
    renderControls({});
    expect(readout()).toBe("200 × 300 px");
  });

  it("follows the frame as it shrinks", () => {
    renderControls({
      value: { x: 0.25, y: 0.25, width: 0.5, height: 0.5, angle: 0 },
    });
    expect(readout()).toBe("100 × 150 px");
  });

  it("admits to being approximate once turned, and only then", () => {
    renderControls({ value: { ...FULL_FRAME, angle: 10 } });
    expect(readout()).toMatch(/^≈ /);

    cleanup();
    renderControls({});
    expect(readout()).not.toMatch(/^≈ /);
  });

  it("is there without a template", () => {
    renderControls({ aspectRatio: undefined });
    expect(readout()).toBe("200 × 300 px");
  });
});

describe("CropFrameControls zoom cluster", () => {
  it("steps the zoom from the buttons", async () => {
    const { onZoomChange, user } = setup(1);

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onZoomChange).toHaveBeenCalledWith(1.25);
  });

  // The readout doubles as the reset, the same pattern as the angle badge.
  it("resets to fit from the percentage readout", async () => {
    const { onZoomChange, user } = setup(2.5);

    expect(
      screen.getByRole("button", { name: "Reset zoom" }),
    ).toHaveTextContent("250%");
    await user.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(onZoomChange).toHaveBeenCalledWith(1);
  });

  it("disables the steps at the bounds", () => {
    setup(MAX_ZOOM);

    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeEnabled();
  });

  it("marks the size readout when the host's verdict is not ok", () => {
    const { container } = renderControls({ sizeVerdict: "too-small" });

    const readout = container.querySelector(".CropFrame-size") as HTMLElement;
    expect(readout.className).toContain("text-danger");
  });

  // The warning belongs to the icon that only appears when there is one; the
  // number keeps saying what the number is.
  it("puts the warning on the icon and not on the dimensions", () => {
    const { container } = renderControls({ sizeVerdict: "too-small" });

    const readout = container.querySelector(".CropFrame-size") as HTMLElement;
    expect(readout.title).not.toMatch(/too extreme a crop/i);
    expect(readout.title).toMatch(/size of the final image/i);

    const warning = readout.querySelector("span[title]") as HTMLElement;
    expect(warning.title).toMatch(/too extreme a crop/i);
  });

  it("shows no warning icon at all on an ok verdict", () => {
    const { container } = renderControls({ sizeVerdict: "ok" });
    const readout = container.querySelector(".CropFrame-size") as HTMLElement;
    expect(readout.querySelector("span[title]")).toBeNull();
  });

  it("leaves the readout unmarked on an ok verdict", () => {
    const { container } = renderControls({ sizeVerdict: "ok" });

    const readout = container.querySelector(".CropFrame-size") as HTMLElement;
    expect(readout.className).not.toContain("text-danger");
    expect(readout.className).not.toContain("text-warning");
  });

  it("offers no cluster when the host does not opt in", () => {
    render(
      <CropFrameControls
        src="blob:stub"
        value={FULL_FRAME}
        onChange={vi.fn()}
        aspectRatio={2 / 3}
        naturalWidth={200}
        naturalHeight={300}
      />,
    );

    expect(screen.queryByRole("button", { name: "Zoom in" })).toBeNull();
  });
});
