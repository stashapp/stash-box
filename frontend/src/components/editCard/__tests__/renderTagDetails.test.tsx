import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderForm } from "src/test/renderForm";
import {
  type OldTagDetails,
  renderTagDetails,
  type TagDetails,
} from "../ModifyEdit";

const render = (
  neu: TagDetails,
  old: OldTagDetails | undefined,
  showDiff: boolean,
) =>
  renderForm(
    <div data-testid="root">{renderTagDetails(neu, old, showDiff)}</div>,
  );

const rowFor = (label: string) => {
  const labelEl = screen.getByText(label);
  return labelEl.closest(".row") as HTMLElement;
};

describe("renderTagDetails", () => {
  describe("create flow (no old)", () => {
    it("renders name without a removed-side column", () => {
      render({ name: "NewTag" }, undefined, false);
      const row = rowFor("Name");
      expect(within(row).getByText("NewTag")).toBeInTheDocument();
      expect(row.querySelector(".bg-danger")).toBeNull();
    });

    it("renders description, category, added_aliases", () => {
      render(
        {
          name: "NewTag",
          description: "desc",
          category: { id: "cat-1", name: "Activity" },
          added_aliases: ["a", "b"],
        },
        undefined,
        false,
      );
      expect(
        within(rowFor("Description")).getByText("desc"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Category")).getByText("Activity"),
      ).toBeInTheDocument();
      expect(within(rowFor("Aliases")).getByText("a, b")).toBeInTheDocument();
    });

    it("omits ChangeRows with no value", () => {
      render({ name: "NewTag" }, undefined, false);
      expect(screen.queryByText("Description")).toBeNull();
      expect(screen.queryByText("Aliases")).toBeNull();
    });
  });

  describe("modify flow (with old)", () => {
    it("shows both old and new values side-by-side for a renamed tag", () => {
      render({ name: "Renamed" }, { name: "Old" }, true);
      const row = rowFor("Name");
      const danger = row.querySelector(".bg-danger");
      const success = row.querySelector(".bg-success");
      expect(danger).toHaveTextContent("Old");
      expect(success).toHaveTextContent("Renamed");
    });

    it("renders category change with links to both old and new", () => {
      render(
        { category: { id: "cat-new", name: "NewCat" } },
        { category: { id: "cat-old", name: "OldCat" } },
        true,
      );
      const row = rowFor("Category");
      const oldLink = within(row).getByRole("link", { name: "OldCat" });
      const newLink = within(row).getByRole("link", { name: "NewCat" });
      expect(oldLink).toHaveAttribute(
        "href",
        expect.stringContaining("cat-old"),
      );
      expect(newLink).toHaveAttribute(
        "href",
        expect.stringContaining("cat-new"),
      );
    });

    it("shows added aliases as the new column even when old is empty", () => {
      // The Aliases ChangeRow reads added_aliases / removed_aliases off the
      // *new* details object — the old object only carries name/description/
      // category here.
      render({ added_aliases: ["new1", "new2"] }, {}, true);
      const aliasRow = rowFor("Aliases");
      expect(within(aliasRow).getByText("new1, new2")).toBeInTheDocument();
    });

    it("renders both columns when both added and removed aliases are present", () => {
      render(
        {
          added_aliases: ["added"],
          removed_aliases: ["removed"],
        },
        {},
        true,
      );
      const aliasRow = rowFor("Aliases");
      const danger = aliasRow.querySelector(".bg-danger");
      const success = aliasRow.querySelector(".bg-success");
      expect(danger).toHaveTextContent("removed");
      expect(success).toHaveTextContent("added");
    });
  });

  describe("no-op", () => {
    it("renders nothing when all fields are null/empty", () => {
      const { container } = render(
        { name: null, description: null, category: null },
        { name: null, description: null, category: null },
        true,
      );
      const root = container.querySelector('[data-testid="root"]');
      // The fragment wrapper still exists; assert no ChangeRow labels rendered.
      expect(within(root as HTMLElement).queryByText("Name")).toBeNull();
      expect(within(root as HTMLElement).queryByText("Description")).toBeNull();
      expect(within(root as HTMLElement).queryByText("Category")).toBeNull();
      expect(within(root as HTMLElement).queryByText("Aliases")).toBeNull();
    });
  });
});
