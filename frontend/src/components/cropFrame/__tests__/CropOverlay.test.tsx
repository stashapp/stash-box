import { render } from "@testing-library/react";
import {
  type CropGuide,
  CropGuideAxisEnum,
  CropGuideRoleEnum,
} from "src/graphql";
import { describe, expect, it } from "vitest";
import CropOverlay from "../CropOverlay";

const guide = (
  axis: CropGuideAxisEnum,
  position: number,
  role: CropGuideRoleEnum | null,
  label: string | null,
  pivot = false,
): CropGuide => ({
  __typename: "CropGuide" as const,
  axis,
  position,
  role,
  label,
  pivot,
});

const GUIDES: CropGuide[] = [
  guide(CropGuideAxisEnum.X, 0.015, CropGuideRoleEnum.MARGIN, "Left margin"),
  guide(CropGuideAxisEnum.X, 0.5, CropGuideRoleEnum.REFERENCE, "Centre"),
  guide(
    CropGuideAxisEnum.Y,
    0.425,
    CropGuideRoleEnum.ANCHOR,
    "Bisects the eyes",
  ),
  guide(CropGuideAxisEnum.Y, 0.77, CropGuideRoleEnum.REFERENCE, "Chin"),
  guide(CropGuideAxisEnum.Y, 0.9, null, null),
];

const lines = (container: HTMLElement) =>
  Array.from(container.querySelectorAll(".CropOverlay-guide"));

describe("CropOverlay", () => {
  it("draws every guide the template carries", () => {
    const { container } = render(<CropOverlay guides={GUIDES} />);
    expect(lines(container)).toHaveLength(GUIDES.length);
  });

  it("draws nothing for a template with no guides", () => {
    const { container } = render(<CropOverlay guides={[]} />);
    expect(lines(container)).toHaveLength(0);
  });

  // A vertical guide is placed across the width and a horizontal one down the
  // height. Putting a position on the wrong axis is the mistake that makes an
  // overlay look plausible and be wrong.
  it("places each guide along its own axis", () => {
    const { container } = render(<CropOverlay guides={GUIDES} />);
    const drawn = lines(container) as HTMLElement[];

    const vertical = drawn.filter((line) =>
      line.classList.contains("CropOverlay-guide-vertical"),
    );
    const horizontal = drawn.filter((line) =>
      line.classList.contains("CropOverlay-guide-horizontal"),
    );

    expect(vertical).toHaveLength(2);
    expect(horizontal).toHaveLength(3);

    expect(vertical[0].style.left).toBe("1.5%");
    expect(vertical[0].style.top).toBe("");
    expect(horizontal[0].style.top).toBe("42.5%");
    expect(horizontal[0].style.left).toBe("");
  });

  // Anchors and references are the lines meant to be lined up on and judged
  // against, so they are worth reading on the image. Only margins and thirds
  // are left to a tooltip, which is the case that turns a frame into a wall
  // of text if it is not.
  it("names anchors and references, and leaves only margins to a tooltip", () => {
    const { container, queryByText } = render(<CropOverlay guides={GUIDES} />);

    expect(queryByText("Bisects the eyes")).not.toBeNull();
    expect(queryByText("Chin")).not.toBeNull();
    expect(queryByText("Centre")).not.toBeNull();
    expect(queryByText("Left margin")).toBeNull();

    const titles = lines(container).map((line) => line.getAttribute("title"));
    expect(titles).toContain("Left margin");
  });

  // The pivot is named whatever its role, including a margin: it is the line
  // the frame resizes about, so it is by definition one to line up on, and
  // keying the name off the role alone would leave it the only unnamed thing
  // on a template where it happens to be a margin.
  it("names the pivot even when it is a margin", () => {
    const { queryByText } = render(
      <CropOverlay
        guides={[
          guide(
            CropGuideAxisEnum.Y,
            0.397,
            CropGuideRoleEnum.MARGIN,
            "Top margin",
            true,
          ),
          guide(
            CropGuideAxisEnum.Y,
            0.77,
            CropGuideRoleEnum.MARGIN,
            "Bottom margin",
          ),
        ]}
      />,
    );

    expect(queryByText("Top margin")).not.toBeNull();
    // And still nothing for the margin that is not the pivot.
    expect(queryByText("Bottom margin")).toBeNull();
  });

  // A template need not say how closely each line should be followed, and an
  // unnamed guide is still a usable one.
  it("draws a guide with no role or label", () => {
    const { container } = render(
      <CropOverlay guides={[guide(CropGuideAxisEnum.Y, 0.5, null, null)]} />,
    );

    const drawn = lines(container) as HTMLElement[];
    expect(drawn).toHaveLength(1);
    expect(drawn[0].style.top).toBe("50%");
    expect(drawn[0].getAttribute("title")).toBeNull();
  });
});
