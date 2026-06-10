import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it } from "vitest";
import ImageContainer from "../Image";

const img = (id: string, w = 100, h = 150) => ({
  id,
  url: `https://example.com/${id}.jpg`,
  width: w,
  height: h,
});

const ONE = [img("a")];
const THREE = [img("a"), img("b"), img("c")];

describe("Image container", () => {
  it("renders as div without lightbox", () => {
    const { container } = renderForm(<ImageContainer images={ONE} />);
    expect(container.querySelector("div.Image")).not.toBeNull();
    expect(container.querySelector("button.Image")).toBeNull();
  });

  it("renders as button when lightbox is set", () => {
    const { container } = renderForm(<ImageContainer images={ONE} lightbox />);
    expect(container.querySelector("button.Image")).not.toBeNull();
  });

  it("shows no count badge for a single image", () => {
    renderForm(<ImageContainer images={ONE} lightbox />);
    expect(screen.queryByText("1")).toBeNull();
  });

  it("shows count badge when there are multiple images", () => {
    renderForm(<ImageContainer images={THREE} lightbox />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("opens lightbox on click", async () => {
    const { user } = renderForm(<ImageContainer images={ONE} lightbox />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders empty-message placeholder when no images", () => {
    renderForm(
      <ImageContainer images={undefined} emptyMessage="Nothing here" />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  describe("lightboxImages", () => {
    it("opens lightbox at the displayed image's position in the set", async () => {
      const set = [img("x", 100, 150), img("y", 200, 100), img("z", 100, 150)];
      // Render the second image but supply the full set
      const { user } = renderForm(
        <ImageContainer images={set[1]} lightboxImages={set} />,
      );
      await user.click(screen.getByRole("button"));
      // Caption should show "2/3 · 200×100" (index 1 of 3)
      const caption = document.querySelector(".ImageLightbox-caption") as HTMLElement;
      expect(caption).not.toBeNull();
      expect(caption.textContent).toMatch(/2\/3/);
      expect(caption.textContent).toContain("200");
    });
  });
});

describe("ImageLightbox (via Image)", () => {
  const openLightbox = async (images: ReturnType<typeof img>[]) => {
    const { user } = renderForm(<ImageContainer images={images} lightbox />);
    await user.click(screen.getByRole("button"));
    return { user };
  };

  describe("single image", () => {
    it("shows dimensions without n/x prefix", async () => {
      await openLightbox([img("solo", 800, 1200)]);
      expect(screen.queryByText(/1\/1/)).toBeNull();
      expect(screen.getByText("800×1200")).toBeInTheDocument();
    });

    it("shows no thumbnail sidebar", async () => {
      await openLightbox([img("solo")]);
      expect(
        document.querySelector(".ImageLightbox-thumbs"),
      ).toBeNull();
    });
  });

  describe("multiple images", () => {
    it("shows n/x prefix in caption", async () => {
      await openLightbox(THREE);
      expect(screen.getByText(/1\/3/)).toBeInTheDocument();
    });

    it("shows a thumbnail for each image", async () => {
      await openLightbox(THREE);
      expect(
        document.querySelectorAll(".ImageLightbox-thumb"),
      ).toHaveLength(3);
    });

    it("clicking a thumbnail changes the selected image", async () => {
      const { user } = await openLightbox([
        img("a", 100, 150),
        img("b", 200, 300),
      ]);
      const thumbs = document.querySelectorAll(".ImageLightbox-thumb");
      await user.click(thumbs[1] as HTMLElement);
      expect(screen.getByText(/2\/2/)).toBeInTheDocument();
      expect(screen.getByText("200×300")).toBeInTheDocument();
    });

    it("ArrowRight advances to next image", async () => {
      await openLightbox([img("a", 100, 150), img("b", 200, 300)]);
      fireEvent.keyDown(document, { key: "ArrowRight" });
      await waitFor(() =>
        expect(screen.getByText(/2\/2/)).toBeInTheDocument(),
      );
    });

    it("ArrowLeft goes back", async () => {
      await openLightbox([img("a", 100, 150), img("b", 200, 300)]);
      fireEvent.keyDown(document, { key: "ArrowRight" });
      await waitFor(() =>
        expect(screen.getByText(/2\/2/)).toBeInTheDocument(),
      );
      fireEvent.keyDown(document, { key: "ArrowLeft" });
      await waitFor(() =>
        expect(screen.getByText(/1\/2/)).toBeInTheDocument(),
      );
    });

    it("ArrowRight clamps at last image", async () => {
      await openLightbox([img("a", 100, 150), img("b", 200, 300)]);
      fireEvent.keyDown(document, { key: "ArrowRight" });
      fireEvent.keyDown(document, { key: "ArrowRight" });
      await waitFor(() =>
        expect(screen.getByText(/2\/2/)).toBeInTheDocument(),
      );
    });
  });

  describe("defaultIndex", () => {
    it("opens at the specified image", async () => {
      const { user } = renderForm(
        <ImageContainer
          images={[img("a", 100, 150), img("b", 200, 300)]}
          lightbox
        />,
      );
      await user.click(screen.getByRole("button"));
      expect(screen.getByText(/1\/2/)).toBeInTheDocument();
    });
  });

  describe("closing", () => {
    it("close button calls onHide", async () => {
      const { user } = await openLightbox(ONE);
      const dialog = screen.getByRole("dialog");
      await user.click(screen.getByRole("button", { name: "" }));
      await waitFor(() => expect(dialog).not.toBeInTheDocument());
    });

    it("Esc key closes the lightbox", async () => {
      const { user } = await openLightbox(ONE);
      const dialog = screen.getByRole("dialog");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(dialog).not.toBeInTheDocument());
    });
  });
});
