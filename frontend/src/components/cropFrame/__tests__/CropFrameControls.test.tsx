import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import CropFrameControls from "../CropFrameControls";
import { CROP_SIZE_WARNINGS, FULL_FRAME } from "../geometry";
import { MAX_ZOOM } from "../zoom";

const renderControls = (
  extra: Partial<ComponentProps<typeof CropFrameControls>> = {},
) => {
  const utils = render(
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
  return { ...utils, user: userEvent.setup() };
};

const readout = () => document.querySelector(".CropFrame-size") as HTMLElement;

describe("CropFrameControls rotation reset", () => {
  it("shows the current angle and resets it", async () => {
    const onChange = vi.fn();
    const { user } = renderControls({
      value: { ...FULL_FRAME, angle: 37 },
      onChange,
    });

    expect(screen.getByText("37.0°")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset rotation" }));
    expect(onChange).toHaveBeenCalledWith(FULL_FRAME);
  });

  it("offers nothing to reset when already straight", () => {
    renderControls();
    expect(
      screen.getByRole("button", { name: "Reset rotation" }),
    ).toBeDisabled();
    expect(screen.queryByText("0.0°")).toBeNull();
  });
});

describe("CropFrameControls size readout", () => {
  it("measures the frame, not the file", () => {
    renderControls();
    expect(screen.getByText("200 × 300 px")).toBeInTheDocument();
  });

  it("follows the frame as it shrinks", () => {
    renderControls({
      value: { x: 0.25, y: 0.25, width: 0.5, height: 0.5, angle: 0 },
    });
    expect(screen.getByText("100 × 150 px")).toBeInTheDocument();
  });

  it("admits to being approximate once turned", () => {
    renderControls({ value: { ...FULL_FRAME, angle: 10 } });
    expect(screen.getByText("≈ 249 × 330 px")).toBeInTheDocument();
  });

  it("is there without a template", () => {
    renderControls({ aspectRatio: undefined });
    expect(screen.getByText("200 × 300 px")).toBeInTheDocument();
  });

  it.each([
    ["ok", false],
    ["too-small", true],
  ] as const)("on a %s verdict is flagged: %s", (verdict, flagged) => {
    renderControls({ sizeVerdict: verdict });

    expect(readout().className.includes("text-danger")).toBe(flagged);
    expect(readout().title).toBe("Size of the final image.");
    expect(readout().querySelector<HTMLElement>("span[title]")?.title).toBe(
      flagged ? CROP_SIZE_WARNINGS["too-small"] : undefined,
    );
  });
});

describe("CropFrameControls zoom cluster", () => {
  const withZoom = (zoom: number) => {
    const onZoomChange = vi.fn();
    return { ...renderControls({ zoom, onZoomChange }), onZoomChange };
  };

  it("steps the zoom from the buttons", async () => {
    const { onZoomChange, user } = withZoom(1);

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onZoomChange).toHaveBeenCalledWith(1.25);
  });

  it("resets to fit from the percentage readout", async () => {
    const { onZoomChange, user } = withZoom(2.5);

    expect(
      screen.getByRole("button", { name: "Reset zoom" }),
    ).toHaveTextContent("250%");
    await user.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(onZoomChange).toHaveBeenCalledWith(1);
  });

  it("disables the steps at the bounds", () => {
    withZoom(MAX_ZOOM);

    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeEnabled();
  });

  it("offers no cluster when the host does not opt in", () => {
    renderControls();
    expect(screen.queryByRole("button", { name: "Zoom in" })).toBeNull();
  });
});
