import { screen, within } from "@testing-library/react";
import { FingerprintAlgorithm, GenderEnum } from "src/graphql";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it } from "vitest";
import {
  type OldSceneDetails,
  renderSceneDetails,
  type SceneDetails,
} from "../ModifyEdit";

const render = (
  neu: SceneDetails,
  old: OldSceneDetails | undefined,
  showDiff: boolean,
) =>
  renderForm(
    <div data-testid="root">{renderSceneDetails(neu, old, showDiff)}</div>,
  );

const rowFor = (label: string) =>
  screen.getByText(label).closest(".row") as HTMLElement;

const site = (id: string) => ({
  id,
  name: `site-${id}`,
  icon: `icon-${id}`,
});

const performer = (id: string, name: string, as: string | null = null) => ({
  as,
  performer: {
    id,
    name,
    gender: GenderEnum.FEMALE,
    disambiguation: null,
    deleted: false,
  },
});

describe("renderSceneDetails", () => {
  describe("create flow", () => {
    it("renders title, date, duration, details, director, production_date, code", () => {
      render(
        {
          title: "My Scene",
          date: "2024-06-01",
          duration: 3661, // 1:01:01
          details: "Some details",
          director: "Jane Director",
          production_date: "2024-05-01",
          code: "CODE-1",
        },
        undefined,
        false,
      );
      expect(within(rowFor("Title")).getByText("My Scene")).toBeInTheDocument();
      expect(
        within(rowFor("Date")).getByText("2024-06-01"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Duration")).getByText("1:01:01"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Details")).getByText("Some details"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Director")).getByText("Jane Director"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Production Date")).getByText("2024-05-01"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Studio Code")).getByText("CODE-1"),
      ).toBeInTheDocument();
    });

    it("renders studio as a link", () => {
      render(
        { title: "X", studio: { id: "stu-1", name: "Acme Pictures" } },
        undefined,
        false,
      );
      const row = rowFor("Studio");
      expect(
        within(row).getByRole("link", { name: "Acme Pictures" }),
      ).toHaveAttribute("href", expect.stringContaining("stu-1"));
    });

    it("renders added performers", () => {
      render(
        {
          title: "X",
          added_performers: [
            performer("p-1", "Alice"),
            performer("p-2", "Bob"),
          ],
        },
        undefined,
        false,
      );
      const row = rowFor("Performers");
      expect(
        within(row).getByRole("link", { name: /Alice/ }),
      ).toBeInTheDocument();
      expect(
        within(row).getByRole("link", { name: /Bob/ }),
      ).toBeInTheDocument();
    });

    it("renders added tags sorted by name", () => {
      render(
        {
          title: "X",
          added_tags: [
            { id: "t-b", name: "beta" },
            { id: "t-a", name: "alpha" },
          ],
        },
        undefined,
        false,
      );
      const row = rowFor("Tags");
      const links = within(row).getAllByRole("link");
      // ListChangeRow sorts via compareByName before rendering
      expect(links[0]).toHaveTextContent("alpha");
      expect(links[1]).toHaveTextContent("beta");
    });

    it("renders added URLs and added images", () => {
      render(
        {
          title: "X",
          added_urls: [{ url: "https://scene.example", site: site("1") }],
          added_images: [{ id: "img-1", url: "u", width: 1920, height: 1080 }],
        },
        undefined,
        false,
      );
      expect(
        screen.getByRole("link", { name: "https://scene.example" }),
      ).toBeInTheDocument();
      expect(screen.getByText("1920 x 1080")).toBeInTheDocument();
    });

    it("renders added fingerprints", () => {
      render(
        {
          title: "X",
          added_fingerprints: [
            {
              hash: "abc123",
              algorithm: FingerprintAlgorithm.PHASH,
              duration: 60,
            },
          ],
        },
        undefined,
        false,
      );
      const row = rowFor("Fingerprints");
      expect(within(row).getByText(/abc123/)).toBeInTheDocument();
      expect(within(row).getByText(/duration: 01:00/)).toBeInTheDocument();
    });

    it("renders a draft-submitted indicator when draft_id is present", () => {
      render({ title: "X", draft_id: "d-1" }, undefined, false);
      expect(screen.getByText("Submitted by draft")).toBeInTheDocument();
    });
  });

  describe("modify flow", () => {
    it("renders title and duration with both old and new values", () => {
      render(
        { title: "Renamed", duration: 7200 },
        { title: "Old Title", duration: 3600 },
        true,
      );
      const titleRow = rowFor("Title");
      expect(titleRow.querySelector(".bg-danger")).toHaveTextContent(
        "Old Title",
      );
      expect(titleRow.querySelector(".bg-success")).toHaveTextContent(
        "Renamed",
      );
      const durationRow = rowFor("Duration");
      expect(durationRow.querySelector(".bg-danger")).toHaveTextContent(
        "1:00:00",
      );
      expect(durationRow.querySelector(".bg-success")).toHaveTextContent(
        "2:00:00",
      );
    });

    it("renders studio swap with both links", () => {
      render(
        { studio: { id: "stu-new", name: "New Studio" } },
        { studio: { id: "stu-old", name: "Old Studio" } },
        true,
      );
      const row = rowFor("Studio");
      expect(
        within(row).getByRole("link", { name: "Old Studio" }),
      ).toHaveAttribute("href", expect.stringContaining("stu-old"));
      expect(
        within(row).getByRole("link", { name: "New Studio" }),
      ).toHaveAttribute("href", expect.stringContaining("stu-new"));
    });

    it("renders performer add/remove side-by-side", () => {
      render(
        {
          added_performers: [performer("p-new", "NewPerf")],
          removed_performers: [performer("p-old", "OldPerf")],
        },
        {},
        true,
      );
      const row = rowFor("Performers");
      expect(within(row).getByText("Removed")).toBeInTheDocument();
      expect(within(row).getByText("Added")).toBeInTheDocument();
      expect(
        within(row).getByRole("link", { name: /OldPerf/ }),
      ).toBeInTheDocument();
      expect(
        within(row).getByRole("link", { name: /NewPerf/ }),
      ).toBeInTheDocument();
    });

    it("renders tag add/remove side-by-side", () => {
      render(
        {
          added_tags: [{ id: "t-new", name: "tag-new" }],
          removed_tags: [{ id: "t-old", name: "tag-old" }],
        },
        {},
        true,
      );
      const row = rowFor("Tags");
      expect(
        within(row).getByRole("link", { name: "tag-old" }),
      ).toBeInTheDocument();
      expect(
        within(row).getByRole("link", { name: "tag-new" }),
      ).toBeInTheDocument();
    });

    it("renders performer 'as' alias when set", () => {
      render(
        {
          added_performers: [performer("p-1", "Alice", "Alyssa")],
        },
        {},
        true,
      );
      // PerformerName renders the alias appended; the exact format depends on
      // the PerformerName component, but the alias text should be present.
      expect(screen.getByText(/Alyssa/)).toBeInTheDocument();
    });
  });

  describe("no-op", () => {
    it("renders no rows when all fields are empty", () => {
      const { container } = render({}, {}, true);
      const root = container.querySelector(
        '[data-testid="root"]',
      ) as HTMLElement;
      for (const label of [
        "Title",
        "Date",
        "Duration",
        "Performers",
        "Studio",
        "Links",
        "Details",
        "Director",
        "Production Date",
        "Studio Code",
        "Tags",
        "Images",
        "Fingerprints",
      ]) {
        expect(within(root).queryByText(label)).toBeNull();
      }
    });
  });
});
