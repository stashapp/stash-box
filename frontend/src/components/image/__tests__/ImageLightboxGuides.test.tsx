import { screen } from "@testing-library/react";
import type { CropTemplateInfo } from "src/components/cropFrame";
import {
  type CropGuide,
  CropGuideAxisEnum,
  CropGuideRoleEnum,
  ImageTypeEnum,
} from "src/graphql";
import { renderForm } from "src/test/renderForm";
import { beforeEach, describe, expect, it } from "vitest";
import ImageLightbox from "../ImageLightbox";

const img = (id: string) => ({
  id,
  url: `https://example.com/${id}.jpg`,
  width: 200,
  height: 300,
});

const guide = (position: number, label: string): CropGuide => ({
  __typename: "CropGuide" as const,
  axis: CropGuideAxisEnum.Y,
  position,
  role: CropGuideRoleEnum.ANCHOR,
  label,
});

// A 2:3 template, matching the 200x300 images below.
const FACE = {
  aspectRatio: 2 / 3,
  guides: [guide(0.425, "Bisects the eyes"), guide(0.77, "Chin")],
};

// A template is resolved from the labels an image carries, so a per-image
// fixture is a label on that image plus one resolver for it
const claiming = <T extends { id: string }>(
  images: T[],
  templates: Record<string, CropTemplateInfo> = {},
) =>
  images.map((image) => ({
    ...image,
    types: templates[image.id] ? [ImageTypeEnum.CROP_FACE] : [],
  }));

const templateFor = (types: readonly string[]) =>
  types.includes(ImageTypeEnum.CROP_FACE) ? FACE : undefined;

const setup = (templates?: Record<string, CropTemplateInfo>) =>
  renderForm(
    <ImageLightbox
      images={claiming([img("a"), img("b")], templates)}
      templateFor={templateFor}
      onClose={() => {}}
    />,
  );

const drawn = () => document.querySelectorAll(".CropOverlay-guide");

beforeEach(() => sessionStorage.clear());

describe("ImageLightbox guides", () => {
  it("draws the focused image's guides once asked for", async () => {
    const { user } = setup({ a: FACE });

    expect(drawn()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Show guides" }));

    expect(drawn()).toHaveLength(2);
    expect(screen.getByText("Bisects the eyes")).toBeInTheDocument();
  });

  it("draws nothing for an image with no crop type", () => {
    setup({ b: FACE });
    expect(drawn()).toHaveLength(0);
  });

  it("draws nothing when no guides are supplied at all", () => {
    setup();
    expect(drawn()).toHaveLength(0);
  });

  it("can be turned on and back off", async () => {
    const { user } = setup({ a: FACE });

    await user.click(screen.getByRole("button", { name: "Show guides" }));
    expect(drawn()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Hide guides" }));
    expect(drawn()).toHaveLength(0);
  });

  it("keeps the choice for the next lightbox in the session", async () => {
    const first = setup({ a: FACE });
    await first.user.click(screen.getByRole("button", { name: "Show guides" }));
    first.unmount();

    setup({ a: FACE });
    expect(drawn()).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Hide guides" }),
    ).toBeInTheDocument();
  });

  it("offers no toggle for an image without guides", () => {
    setup({ b: FACE });
    expect(screen.queryByRole("button", { name: "Hide guides" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Show guides" })).toBeNull();
  });

  it("follows the focused image", async () => {
    const { user } = renderForm(
      <ImageLightbox
        images={claiming([img("a"), img("b")], { b: FACE })}
        templateFor={templateFor}
        onClose={() => {}}
      />,
    );

    // The first image has no template, so there is nothing to switch on
    expect(screen.queryByRole("button", { name: /guides/i })).toBeNull();

    await user.keyboard("{ArrowRight}");

    await user.click(screen.getByRole("button", { name: "Show guides" }));
    expect(drawn()).toHaveLength(2);
  });
});

describe("ImageLightbox off-aspect emphasis on Re-crop", () => {
  const recropButton = () => screen.queryByRole("button", { name: "Re-crop" });

  const setupRecrop = (
    templates?: Record<string, CropTemplateInfo>,
    images = [img("a"), img("b")],
  ) =>
    renderForm(
      <ImageLightbox
        images={claiming(images, templates)}
        templateFor={templateFor}
        onRecrop={() => {}}
        onClose={() => {}}
      />,
    );

  it("carries no title when the image matches its template", () => {
    setupRecrop({ a: FACE });
    expect(recropButton()).not.toHaveAttribute("title");
  });

  it("flags an image whose proportions are not the template's", () => {
    setupRecrop({ a: FACE }, [{ ...img("a"), width: 300, height: 300 }]);
    expect(recropButton()).toHaveAttribute(
      "title",
      "These proportions do not match the crop this image is labelled with",
    );
  });

  it("tolerates rounding", () => {
    setupRecrop({ a: FACE }, [{ ...img("a"), width: 799, height: 1200 }]);
    expect(recropButton()).not.toHaveAttribute("title");
  });

  it("says nothing about an image claiming no template", () => {
    setupRecrop(undefined, [{ ...img("a"), width: 300, height: 300 }]);
    expect(recropButton()).not.toHaveAttribute("title");
  });

  // An SVG stores -1 for both dimensions
  it("says nothing about an image with no real dimensions", () => {
    setupRecrop({ a: FACE }, [{ ...img("a"), width: -1, height: -1 }]);
    expect(recropButton()).not.toHaveAttribute("title");
  });
});

describe("ImageLightbox guides on an image that does not fit", () => {
  const square = (id: string) => ({
    id,
    url: `https://example.com/${id}.jpg`,
    width: 300,
    height: 300,
  });

  const show = async (image: ReturnType<typeof square>) => {
    const { user } = renderForm(
      <ImageLightbox
        images={claiming([image], { [image.id]: FACE })}
        templateFor={templateFor}
        onRecrop={() => {}}
        onClose={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Show guides" }));
    return document.querySelector(".CropOverlay") as HTMLElement;
  };

  // A 2:3 frame in a square picture is full height and two thirds as wide
  it("shrinks the overlay to the template's shape", async () => {
    const overlay = await show(square("a"));

    expect(overlay.style.height).toBe("100%");
    expect(Number.parseFloat(overlay.style.width)).toBeCloseTo(66.667, 2);
  });

  it("centres what is left over", async () => {
    const overlay = await show(square("a"));

    expect(Number.parseFloat(overlay.style.left)).toBeCloseTo(16.667, 2);
    expect(overlay.style.top).toBe("0%");
  });

  it("draws the frame edge", async () => {
    const overlay = await show(square("a"));
    expect(overlay.className).toContain("CropOverlay-inset");
  });

  it("says so on the Re-crop link too", async () => {
    await show(square("a"));
    expect(screen.getByRole("button", { name: "Re-crop" })).toHaveAttribute(
      "title",
    );
  });

  it("leaves a fitting image alone", async () => {
    const { user } = renderForm(
      <ImageLightbox
        images={claiming([img("a")], { a: FACE })}
        templateFor={templateFor}
        onRecrop={() => {}}
        onClose={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Show guides" }));

    const overlay = document.querySelector(".CropOverlay") as HTMLElement;
    expect(overlay.style.width).toBe("100%");
    expect(overlay.style.height).toBe("100%");
    expect(overlay.className).not.toContain("CropOverlay-inset");
    expect(
      screen.queryByRole("button", { name: "Re-crop" }),
    ).not.toHaveAttribute("title");
  });
});

describe("the guides toggle as a toggle", () => {
  it("reports its state, not just its label", async () => {
    const { user } = setup({ a: FACE });

    const toggle = () =>
      screen.getByRole("button", { name: /(Show|Hide) guides/ });

    expect(toggle()).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
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

  it("insets the overlay to the picture when the box is wider", async () => {
    const restore = withBoxSize(600, 300); // 2:1, against a 2:3 image
    try {
      const { user } = setup({ a: FACE });
      await user.click(screen.getByRole("button", { name: "Show guides" }));

      const box = overlayBox();
      expect(box).not.toBeNull();
      // A 2:3 picture in a 2:1 box fills the height and a third of the width
      expect(box?.style.height).toBe("100%");
      expect(Number.parseFloat(box?.style.width ?? "0")).toBeCloseTo(33.33, 1);
      // Centred, so a third of the way in
      expect(Number.parseFloat(box?.style.left ?? "0")).toBeCloseTo(33.33, 1);
    } finally {
      restore();
    }
  });

  it("fills the box when it already matches the image", async () => {
    const restore = withBoxSize(200, 300); // the image's own shape
    try {
      const { user } = setup({ a: FACE });
      await user.click(screen.getByRole("button", { name: "Show guides" }));

      const box = overlayBox();
      expect(box?.style.width).toBe("100%");
      expect(box?.style.height).toBe("100%");
    } finally {
      restore();
    }
  });
});

describe("ImageLightbox guides arrive already fitted", () => {
  // Measurable synchronously, like a browser; never delivers asynchronously, unlike one.
  // Anything the overlay gets right here, it got from the sync read.
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
    const restore = withMeasurableBox(600, 300); // 2:1, against a 2:3 image
    try {
      const { user } = setup({ a: FACE });
      await user.click(screen.getByRole("button", { name: "Show guides" }));

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
