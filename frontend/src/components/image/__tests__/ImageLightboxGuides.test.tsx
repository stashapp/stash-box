import { screen } from "@testing-library/react";
import {
  type CropGuide,
  CropGuideAxisEnum,
  CropGuideRoleEnum,
  type CropTemplate,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  ImageTypeGroupsDocument,
} from "src/graphql";
import { renderForm } from "src/test/renderForm";
import { beforeEach, describe, expect, it } from "vitest";
import ImageLightbox, { type LightboxImage } from "../ImageLightbox";

const img = (id: string, width = 200, height = 300) => ({
  id,
  url: `https://example.com/${id}.jpg`,
  width,
  height,
});

const guide = (position: number, label: string): CropGuide => ({
  __typename: "CropGuide" as const,
  axis: CropGuideAxisEnum.Y,
  position,
  role: CropGuideRoleEnum.ANCHOR,
  label,
});

// A 2:3 template, matching the 200x300 images above
const FACE: CropTemplate = {
  __typename: "CropTemplate",
  aspect_ratio: 2 / 3,
  guides: [guide(0.425, "Bisects the eyes"), guide(0.77, "Chin")],
};

const vocabularyMock = {
  request: {
    query: ImageTypeGroupsDocument,
    variables: { includeDisabled: true },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      imageTypeGroups: [
        {
          __typename: "ImageTypeGroup" as const,
          key: ImageTypeGroupEnum.CROP,
          name: "Crop",
          description: null,
          enabled: true,
          types: [
            {
              __typename: "ImageType" as const,
              key: ImageTypeEnum.CROP_FACE,
              name: "Face",
              description: null,
              enabled: true,
              conflicts_with: [],
              crop_template: FACE,
            },
          ],
        },
      ],
    },
  },
};
const recrop = { canAddAsNew: true, onRecropped: () => {} };

// Labels the named images with the crop type whose template is FACE
const claiming = <T extends { id: string }>(
  images: T[],
  ...cropped: string[]
) =>
  images.map((image) => ({
    ...image,
    types: cropped.includes(image.id) ? [ImageTypeEnum.CROP_FACE] : [],
  }));

const setup = (images: LightboxImage[], withRecrop = false) =>
  renderForm(
    <ImageLightbox
      images={images}
      recrop={withRecrop ? recrop : undefined}
      onClose={() => {}}
    />,
    { mocks: [vocabularyMock] },
  );

const drawn = () => document.querySelectorAll(".CropOverlay-guide");
const toggle = () => screen.getByRole("button", { name: /(Show|Hide) guides/ });
const showGuides = async (user: ReturnType<typeof setup>["user"]) =>
  user.click(await screen.findByRole("button", { name: "Show guides" }));

beforeEach(() => sessionStorage.clear());

describe("ImageLightbox guides", () => {
  it("draws the focused image's guides once asked for, and takes them away again", async () => {
    const { user } = setup(claiming([img("a"), img("b")], "a"));

    expect(drawn()).toHaveLength(0);
    await screen.findByRole("button", { name: "Show guides" });
    expect(toggle()).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle());
    expect(drawn()).toHaveLength(2);
    expect(screen.getByText("Bisects the eyes")).toBeInTheDocument();
    expect(toggle()).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle());
    expect(drawn()).toHaveLength(0);
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
  });

  it("offers nothing for an image with no crop type", async () => {
    setup(claiming([img("a"), img("b")], "b"));

    await screen.findByRole("dialog");
    expect(drawn()).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /guides/i })).toBeNull();
  });

  it("keeps the choice for the next lightbox in the session", async () => {
    const first = setup(claiming([img("a")], "a"));
    await showGuides(first.user);
    first.unmount();

    setup(claiming([img("a")], "a"));
    expect(
      await screen.findByRole("button", { name: "Hide guides" }),
    ).toBeInTheDocument();
    expect(drawn()).toHaveLength(2);
  });

  it("follows the focused image", async () => {
    const { user } = setup(claiming([img("a"), img("b")], "b"));

    await screen.findByRole("dialog");
    expect(screen.queryByRole("button", { name: /guides/i })).toBeNull();

    await user.keyboard("{ArrowRight}");
    await showGuides(user);

    expect(drawn()).toHaveLength(2);
  });
});

describe("ImageLightbox off-aspect emphasis on Re-crop", () => {
  const recropButton = () => screen.findByRole("button", { name: "Re-crop" });

  // An SVG stores -1 for both dimensions
  it.each([
    [200, 300, null],
    [799, 1200, null],
    [-1, -1, null],
    [
      300,
      300,
      "These proportions do not match the crop this image is labelled with",
    ],
  ])("titles a %dx%d image: %s", async (width, height, title) => {
    setup(claiming([img("a", width, height)], "a"), true);

    if (title) {
      expect(await recropButton()).toHaveAttribute("title", title);
    } else {
      expect(await recropButton()).not.toHaveAttribute("title");
    }
  });
});

describe("ImageLightbox guides on an image that does not fit", () => {
  const overlay = () => document.querySelector(".CropOverlay") as HTMLElement;

  // A 2:3 frame in a square picture is full height, two thirds as wide and centred
  it("shrinks the overlay to the template's shape and says so on Re-crop", async () => {
    const { user } = setup(claiming([img("a", 300, 300)], "a"), true);
    await showGuides(user);

    expect(overlay().style.height).toBe("100%");
    expect(Number.parseFloat(overlay().style.width)).toBeCloseTo(66.667, 2);
    expect(Number.parseFloat(overlay().style.left)).toBeCloseTo(16.667, 2);
    expect(overlay().style.top).toBe("0%");
    expect(overlay().className).toContain("CropOverlay-inset");
    expect(screen.getByRole("button", { name: "Re-crop" })).toHaveAttribute(
      "title",
    );
  });

  it("leaves a fitting image alone", async () => {
    const { user } = setup(claiming([img("a")], "a"), true);
    await showGuides(user);

    expect(overlay().style.width).toBe("100%");
    expect(overlay().style.height).toBe("100%");
    expect(overlay().className).not.toContain("CropOverlay-inset");
    expect(screen.getByRole("button", { name: "Re-crop" })).not.toHaveAttribute(
      "title",
    );
  });
});

describe("ImageLightbox guides on a box that is not the image's shape", () => {
  const withBoxSize = (width: number, height: number) => {
    const original = window.ResizeObserver;
    window.ResizeObserver = class {
      constructor(private cb: ResizeObserverCallback) {}
      observe(el: Element) {
        this.cb(
          [
            {
              target: el,
              contentRect: { width, height },
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    return () => {
      window.ResizeObserver = original;
    };
  };

  const overlayBox = () =>
    document.querySelector<HTMLElement>(".CropFrame-overlay-box > div");

  // A 2:3 picture in a 2:1 box fills the height and the middle third of the width
  it("insets the overlay to the picture when the box is wider", async () => {
    const restore = withBoxSize(600, 300);
    try {
      const { user } = setup(claiming([img("a")], "a"));
      await showGuides(user);

      const box = overlayBox();
      expect(box?.style.height).toBe("100%");
      expect(Number.parseFloat(box?.style.width ?? "0")).toBeCloseTo(33.33, 1);
      expect(Number.parseFloat(box?.style.left ?? "0")).toBeCloseTo(33.33, 1);
    } finally {
      restore();
    }
  });

  it("fills the box when it already matches the image", async () => {
    const restore = withBoxSize(200, 300);
    try {
      const { user } = setup(claiming([img("a")], "a"));
      await showGuides(user);

      const box = overlayBox();
      expect(box?.style.width).toBe("100%");
      expect(box?.style.height).toBe("100%");
    } finally {
      restore();
    }
  });
});

describe("ImageLightbox guides arrive already fitted", () => {
  // Measurable synchronously, like a browser, but never delivering an observer callback
  const withMeasurableBox = (width: number, height: number) => {
    const observer = window.ResizeObserver;
    const rect = Element.prototype.getBoundingClientRect;

    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;

    Element.prototype.getBoundingClientRect = function (this: Element) {
      return this.classList.contains("CropFrame-overlay-box")
        ? ({ width, height } as DOMRect)
        : ({ width: 0, height: 0 } as DOMRect);
    };

    return () => {
      window.ResizeObserver = observer;
      Element.prototype.getBoundingClientRect = rect;
    };
  };

  it("fits on the first render, with no observer callback at all", async () => {
    const restore = withMeasurableBox(600, 300);
    try {
      const { user } = setup(claiming([img("a")], "a"));
      await showGuides(user);

      const box = document.querySelector<HTMLElement>(
        ".CropFrame-overlay-box > div",
      );
      expect(Number.parseFloat(box?.style.width ?? "0")).toBeCloseTo(33.33, 1);
      expect(box?.style.visibility).toBe("");
    } finally {
      restore();
    }
  });
});
