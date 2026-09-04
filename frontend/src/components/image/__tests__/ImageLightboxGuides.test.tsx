import { screen } from "@testing-library/react";
import type { CropTemplateInfo } from "src/components/cropFrame";
import {
  type CropGuide,
  CropGuideAxisEnum,
  CropGuideRoleEnum,
} from "src/graphql";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it, vi } from "vitest";
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
  pivot: false,
});

// A 2:3 template, matching the 200x300 images below.
const FACE = {
  aspectRatio: 2 / 3,
  guides: [guide(0.425, "Bisects the eyes"), guide(0.77, "Chin")],
};

const setup = (cropTemplates?: Record<string, CropTemplateInfo>) =>
  renderForm(
    <ImageLightbox
      images={[img("a"), img("b")]}
      cropTemplates={cropTemplates}
      onClose={() => {}}
    />,
  );

// Queried from the document, not the render container: the lightbox is a
// modal and renders into a portal on document.body. Scoping to the container
// finds nothing, which makes every "draws no guides" assertion pass for the
// wrong reason.
const drawn = () => document.querySelectorAll(".CropOverlay-guide");

describe("ImageLightbox guides", () => {
  // The point of showing these: an image already uploaded can be held against
  // the frame it says it follows, which is what a reviewer needs in an edit
  // diff and has no other way to check.
  it("draws the focused image's guides once asked for", async () => {
    const { user } = setup({ a: FACE });

    // Off until asked: looking at the photograph is what the lightbox is for.
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

  // Guides are the reason to look, but the picture underneath has to be
  // lookable-at unobstructed too.
  it("can be turned on and back off", async () => {
    const { user } = setup({ a: FACE });

    await user.click(screen.getByRole("button", { name: "Show guides" }));
    expect(drawn()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Hide guides" }));
    expect(drawn()).toHaveLength(0);
  });

  // No toggle where there is nothing to toggle, or every image in a gallery
  // grows a control that does nothing.
  it("offers no toggle for an image without guides", () => {
    setup({ b: FACE });
    expect(screen.queryByRole("button", { name: "Hide guides" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Show guides" })).toBeNull();
  });

  // Each image carries its own frame, so stepping through a gallery has to
  // follow the focus rather than keeping the first image's guides.
  it("follows the focused image", async () => {
    const { user } = renderForm(
      <ImageLightbox
        images={[img("a"), img("b")]}
        cropTemplates={{ b: FACE }}
        onClose={() => {}}
      />,
    );

    // The first image has no template, so there is nothing to switch on.
    expect(screen.queryByRole("button", { name: /guides/i })).toBeNull();

    await user.keyboard("{ArrowRight}");

    await user.click(screen.getByRole("button", { name: "Show guides" }));
    expect(drawn()).toHaveLength(2);
  });
});

// A mismatch is shown as emphasis on the Re-crop link itself, with the
// explanation on its title, rather than as a separate badge saying the same
// thing twice.
describe("ImageLightbox off-aspect emphasis on Re-crop", () => {
  const recropButton = () => screen.queryByRole("button", { name: "Re-crop" });

  const setupRecrop = (
    cropTemplates?: Record<string, CropTemplateInfo>,
    images = [img("a"), img("b")],
  ) =>
    renderForm(
      <ImageLightbox
        images={images}
        cropTemplates={cropTemplates}
        onRecrop={() => {}}
        onClose={() => {}}
      />,
    );

  // Checked against the template the image claims, not against a fixed 2:3, so
  // an instance with its own templates gets an answer about its own rules.
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

  // Whole-pixel rounding puts a real crop a fraction off its template, and
  // flagging every correctly cropped image would make the signal worthless.
  it("tolerates rounding", () => {
    setupRecrop({ a: FACE }, [{ ...img("a"), width: 799, height: 1200 }]);
    expect(recropButton()).not.toHaveAttribute("title");
  });

  // Whether the entrypoint is offered at all for an untemplated image is a
  // canRecrop decision the caller makes (see editImages.tsx); ImageLightbox
  // itself only has an opinion about the title once shown.
  it("says nothing about an image claiming no template", () => {
    setupRecrop(undefined, [{ ...img("a"), width: 300, height: 300 }]);
    expect(recropButton()).not.toHaveAttribute("title");
  });

  // An SVG stores -1 for both dimensions. Flagging it would say nothing true.
  it("says nothing about an image with no real dimensions", () => {
    setupRecrop({ a: FACE }, [{ ...img("a"), width: -1, height: -1 }]);
    expect(recropButton()).not.toHaveAttribute("title");
  });
});

/**
 * The overlay is drawn inside a box of the template's shape, not stretched
 * over the picture.
 *
 * Stretching made the guides fit whatever they were laid over, so an image the
 * caption called "off frame" had its eye line drawn exactly where a fitting
 * image would -- the overlay quietly contradicting the badge beside it.
 */
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
        images={[image]}
        cropTemplates={{ [image.id]: FACE }}
        onRecrop={() => {}}
        onClose={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Show guides" }));
    return document.querySelector(".CropOverlay") as HTMLElement;
  };

  // A 2:3 frame in a square picture is full height and two thirds as wide.
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

  // Without an edge the guides simply stop short of the photograph, which
  // reads as them being misplaced rather than as the picture being too wide.
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

  // The common case must be untouched: a picture that fits gets the whole box
  // and no edge drawn on top of its own.
  it("leaves a fitting image alone", async () => {
    const { user } = renderForm(
      <ImageLightbox
        images={[img("a")]}
        cropTemplates={{ a: FACE }}
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

  // The room reserved for guide labels (.ImageLightbox-main's left padding)
  // is unconditional -- a plain CSS rule with no state driving it, so the
  // picture never jumps sideways on "Show guides", on picking a crop label,
  // or on stepping between a guided and an unguided image in the same
  // gallery. Nothing to unit-test here -- vitest does not load real
  // stylesheets (see vite.config.mjs's `css: false`), so a computed-style
  // assertion would only prove jsdom's default rather than this rule.
  // Verified visually instead: measuring .ImageLightbox-main's position
  // before and after picking a crop label in a real browser shows no
  // movement.
});

// The toggle says whether it is on. The label changes too, which a sighted
// user reads -- but "Hide guides, button" announced on its own leaves it
// ambiguous whether the guides are showing or that is merely the offer.
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

/**
 * The overlay must sit on the picture, not on the box the picture is in.
 *
 * The lightbox column constrains .Image on both axes, so the box is not always
 * the image's shape; the picture then letterboxes inside it and an overlay
 * drawn at 100% of the box reaches past the photograph. That would be worst in
 * an edit diff, where the whole point is holding an image against its frame.
 */
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
    document.querySelector<HTMLElement>(".ImageLightbox-overlay-box > div");

  it("insets the overlay to the picture when the box is wider", async () => {
    const restore = withBoxSize(600, 300); // 2:1, against a 2:3 image
    try {
      const { user } = setup({ a: FACE });
      await user.click(screen.getByRole("button", { name: "Show guides" }));

      const box = overlayBox();
      expect(box).not.toBeNull();
      // A 2:3 picture in a 2:1 box fills the height and a third of the width.
      expect(box?.style.height).toBe("100%");
      expect(Number.parseFloat(box?.style.width ?? "0")).toBeCloseTo(33.33, 1);
      // Centred, so a third of the way in.
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

/**
 * The overlay is sized from a synchronous read in the ref callback, not from
 * ResizeObserver's first delivery, which is asynchronous. Without that read the
 * fallback geometry paints for a frame -- and because the lightbox keys its
 * image on the url, the component remounts on every step through a gallery, so
 * the wrong frame flashes each time rather than once at startup.
 */
describe("ImageLightbox guides arrive already fitted", () => {
  // Measurable synchronously, like a browser; never delivers asynchronously,
  // unlike one. Anything the overlay gets right here, it got from the sync read.
  const withMeasurableBox = (width: number, height: number) => {
    const observer = window.ResizeObserver;
    const rect = Element.prototype.getBoundingClientRect;

    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;

    Element.prototype.getBoundingClientRect = function (this: Element) {
      return this.classList.contains("ImageLightbox-overlay-box")
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
        ".ImageLightbox-overlay-box > div",
      );
      expect(Number.parseFloat(box?.style.width ?? "0")).toBeCloseTo(33.33, 1);
      // Not hidden: hiding is what an environment that cannot measure gets.
      expect(box?.style.visibility).toBe("");
    } finally {
      restore();
    }
  });
});

// Every way focus can move funnels through the same guard, so one
// representative of each kind (thumbnail, arrow key, close) is enough to
// show it is actually wired up everywhere rather than just on one of them.
describe("ImageLightbox confirmLeave", () => {
  const thumbs = () =>
    [...document.querySelectorAll(".ImageLightbox-thumb")] as HTMLElement[];
  const caption = () =>
    document.querySelector(".ImageLightbox-caption")?.textContent ?? "";

  it("blocks a thumbnail click when confirmLeave declines", async () => {
    const confirmLeave = vi.fn().mockReturnValue(false);
    const { user } = renderForm(
      <ImageLightbox
        images={[img("a"), img("b")]}
        confirmLeave={confirmLeave}
        onClose={() => {}}
      />,
    );

    await user.click(thumbs()[1]);

    expect(confirmLeave).toHaveBeenCalledWith("a");
    expect(caption()).toContain("1/2");
  });

  it("allows a thumbnail click when confirmLeave accepts", async () => {
    const confirmLeave = vi.fn().mockReturnValue(true);
    const { user } = renderForm(
      <ImageLightbox
        images={[img("a"), img("b")]}
        confirmLeave={confirmLeave}
        onClose={() => {}}
      />,
    );

    await user.click(thumbs()[1]);

    expect(caption()).toContain("2/2");
  });

  it("blocks arrow-key navigation the same way", async () => {
    const confirmLeave = vi.fn().mockReturnValue(false);
    const { user } = renderForm(
      <ImageLightbox
        images={[img("a"), img("b")]}
        confirmLeave={confirmLeave}
        onClose={() => {}}
      />,
    );

    await user.keyboard("{ArrowRight}");

    expect(confirmLeave).toHaveBeenCalledWith("a");
    expect(caption()).toContain("1/2");
  });

  it("blocks closing the lightbox the same way", async () => {
    const confirmLeave = vi.fn().mockReturnValue(false);
    const onClose = vi.fn();
    const { user } = renderForm(
      <ImageLightbox
        images={[img("a"), img("b")]}
        confirmLeave={confirmLeave}
        onClose={onClose}
      />,
    );

    await user.click(
      document.querySelector(".ImageLightbox-close") as HTMLElement,
    );

    expect(confirmLeave).toHaveBeenCalledWith("a");
    expect(onClose).not.toHaveBeenCalled();
  });

  // No editor, nothing that could go unsaved: every move works exactly as
  // it would with no confirmLeave wired up at all.
  it("allows every move when confirmLeave is absent", async () => {
    const { user } = renderForm(
      <ImageLightbox images={[img("a"), img("b")]} onClose={() => {}} />,
    );

    await user.click(thumbs()[1]);

    expect(caption()).toContain("2/2");
  });
});
