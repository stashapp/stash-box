import { fireEvent, render, screen } from "@testing-library/react";
import {
  type CropGuide,
  CropGuideAxisEnum,
  CropGuideRoleEnum,
} from "src/graphql";
import { describe, expect, it } from "vitest";
import CropOverlay, { PIN_HINT } from "../CropOverlay";

const guide = (
  axis: CropGuideAxisEnum,
  position: number,
  role: CropGuideRoleEnum | null,
  label: string | null,
): CropGuide => ({
  __typename: "CropGuide" as const,
  axis,
  position,
  role,
  label,
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

  it("names anchors and references, and leaves only margins to a tooltip", () => {
    const { container, queryByText } = render(<CropOverlay guides={GUIDES} />);

    expect(queryByText("Bisects the eyes")).not.toBeNull();
    expect(queryByText("Chin")).not.toBeNull();
    expect(queryByText("Centre")).not.toBeNull();
    expect(queryByText("Left margin")).toBeNull();

    const titles = lines(container).map((line) => line.getAttribute("title"));
    expect(titles).toContain("Left margin");
  });

  it("names a margin that says where the body is cut, not one that only marks the edge", () => {
    const { queryByText } = render(
      <CropOverlay
        guides={[
          guide(
            CropGuideAxisEnum.Y,
            0.01,
            CropGuideRoleEnum.MARGIN,
            "Top margin",
          ),
          guide(
            CropGuideAxisEnum.Y,
            0.9,
            CropGuideRoleEnum.MARGIN,
            "Above the knees",
          ),
          guide(
            CropGuideAxisEnum.Y,
            0.99,
            CropGuideRoleEnum.MARGIN,
            "Bottom margin",
          ),
        ]}
      />,
    );

    expect(queryByText("Top margin")).toBeNull();
    expect(queryByText("Bottom margin")).toBeNull();
    expect(queryByText("Above the knees")).not.toBeNull();
  });

  it("makes the landmark anchor primary rather than the one at the edge", () => {
    const { container } = render(
      <CropOverlay
        guides={[
          guide(
            CropGuideAxisEnum.Y,
            0.01,
            CropGuideRoleEnum.ANCHOR,
            "Top of the hair",
          ),
          guide(
            CropGuideAxisEnum.Y,
            0.4,
            CropGuideRoleEnum.ANCHOR,
            "Bisects the eyes",
          ),
        ]}
      />,
    );

    const byTitle = (title: string) =>
      lines(container).find((line) => line.getAttribute("title") === title);
    expect(byTitle("Bisects the eyes")?.className).toContain(
      "CropOverlay-guide-anchor-primary",
    );
    expect(byTitle("Top of the hair")?.className).toContain(
      "CropOverlay-guide-anchor-secondary",
    );
  });

  it("hints at Shift on the red label only where pinning works", async () => {
    const eyes = guide(
      CropGuideAxisEnum.Y,
      0.4,
      CropGuideRoleEnum.ANCHOR,
      "Bisects the eyes",
    );
    const { unmount } = render(<CropOverlay guides={[eyes]} pinHint />);
    fireEvent.mouseOver(screen.getByText("Bisects the eyes"));
    expect(await screen.findByText(PIN_HINT)).toBeInTheDocument();
    unmount();

    render(<CropOverlay guides={[eyes]} />);
    fireEvent.mouseOver(screen.getByText("Bisects the eyes"));
    expect(screen.queryByText(PIN_HINT)).toBeNull();
  });

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
