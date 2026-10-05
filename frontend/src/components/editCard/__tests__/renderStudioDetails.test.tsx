import { screen, within } from "@testing-library/react";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it } from "vitest";
import {
  type OldStudioDetails,
  renderStudioDetails,
  type StudioDetails,
} from "../ModifyEdit";

const render = (
  neu: StudioDetails,
  old: OldStudioDetails | undefined,
  showDiff: boolean,
) =>
  renderForm(
    <div data-testid="root">{renderStudioDetails(neu, old, showDiff)}</div>,
  );

const rowFor = (label: string) =>
  screen.getByText(label).closest(".row") as HTMLElement;

const site = (id: string, name = `site-${id}`) => ({
  id,
  name,
  icon: `icon-${id}`,
});

describe("renderStudioDetails", () => {
  describe("create flow", () => {
    it("renders name + parent + aliases without diff columns", () => {
      render(
        {
          name: "New Studio",
          parent: { id: "parent-1", name: "Parent" },
          added_aliases: ["alt-1", "alt-2"],
        },
        undefined,
        false,
      );
      expect(
        within(rowFor("Name")).getByText("New Studio"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Network")).getByRole("link", { name: "Parent" }),
      ).toHaveAttribute("href", expect.stringContaining("parent-1"));
      expect(
        within(rowFor("Aliases")).getByText("alt-1, alt-2"),
      ).toBeInTheDocument();
    });

    it("renders added URLs without an old column", () => {
      render(
        { added_urls: [{ url: "https://a.example", site: site("1") }] },
        undefined,
        false,
      );
      expect(screen.getByText("Links")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "https://a.example" }),
      ).toHaveAttribute("href", "https://a.example");
      expect(screen.queryByText("Removed")).toBeNull();
    });

    it("renders added images with dimensions", () => {
      render(
        {
          added_images: [{ id: "img-1", url: "u", width: 100, height: 200 }],
        },
        undefined,
        false,
      );
      expect(screen.getByText("Images")).toBeInTheDocument();
      expect(screen.getByText("100 x 200")).toBeInTheDocument();
    });
  });

  describe("modify flow", () => {
    it("renders both old and new for renamed studio", () => {
      render({ name: "Renamed" }, { name: "Old" }, true);
      const row = rowFor("Name");
      expect(row.querySelector(".bg-danger")).toHaveTextContent("Old");
      expect(row.querySelector(".bg-success")).toHaveTextContent("Renamed");
    });

    it("renders parent change with both links", () => {
      render(
        { parent: { id: "p-new", name: "NewParent" } },
        { parent: { id: "p-old", name: "OldParent" } },
        true,
      );
      const row = rowFor("Network");
      expect(
        within(row).getByRole("link", { name: "OldParent" }),
      ).toHaveAttribute("href", expect.stringContaining("p-old"));
      expect(
        within(row).getByRole("link", { name: "NewParent" }),
      ).toHaveAttribute("href", expect.stringContaining("p-new"));
    });

    it("renders URL add and remove side-by-side", () => {
      render(
        {
          added_urls: [{ url: "https://new.example", site: site("1") }],
          removed_urls: [{ url: "https://old.example", site: site("2") }],
        },
        {},
        true,
      );
      expect(screen.getByText("Removed")).toBeInTheDocument();
      expect(screen.getByText("Added")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "https://old.example" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "https://new.example" }),
      ).toBeInTheDocument();
    });

    it("renders deleted-image placeholder for null entries", () => {
      const { container } = render(
        {
          added_images: [{ id: "img-new", url: "u", width: 10, height: 10 }],
          removed_images: [null],
        },
        {},
        true,
      );
      const deleted = container.querySelector("img[alt='Deleted']");
      expect(deleted).toBeInTheDocument();
    });
  });

  describe("no-op", () => {
    it("renders no rows when all fields are absent/empty", () => {
      const { container } = render({}, {}, true);
      const root = container.querySelector('[data-testid="root"]');
      expect(within(root as HTMLElement).queryByText("Name")).toBeNull();
      expect(within(root as HTMLElement).queryByText("Network")).toBeNull();
      expect(within(root as HTMLElement).queryByText("Links")).toBeNull();
      expect(within(root as HTMLElement).queryByText("Images")).toBeNull();
    });
  });
});
