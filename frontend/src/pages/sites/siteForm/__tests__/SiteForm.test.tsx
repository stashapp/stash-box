import { screen, waitFor } from "@testing-library/react";
import { type ReactElement } from "react";
import { ValidSiteTypeEnum } from "src/graphql/types";
import { siteCategoriesMock } from "src/test/graphqlMocks";
import { renderForm } from "src/test/renderForm";
import { selectReactSelect } from "src/test/selectors";
import { describe, expect, it, vi } from "vitest";
import SiteForm from "../SiteForm";

const baseSite = {
  __typename: "Site" as const,
  id: "site-1",
  name: "Existing",
  category: null,
  description: "Existing desc",
  url: "https://existing.org",
  regex: "(https?://example\\.org/.*)",
  valid_types: [ValidSiteTypeEnum.SCENE],
  created: "2024-01-01",
  updated: "2024-01-01",
  icon: "",
};

const selectType = (
  user: ReturnType<typeof renderForm>["user"],
  label: string,
) => selectReactSelect(user, label);

const render = (ui: ReactElement) =>
  renderForm(ui, { mocks: [siteCategoriesMock] });

describe("SiteForm", () => {
  describe("create", () => {
    it("submits with all fields filled", async () => {
      const callback = vi.fn();
      const { user } = render(<SiteForm callback={callback} />);

      await user.type(screen.getByPlaceholderText("Name"), "My Site");
      await user.type(
        screen.getByPlaceholderText("Description"),
        "A description",
      );
      await user.type(
        screen.getByPlaceholderText("URL"),
        "https://example.org",
      );
      await user.type(
        screen.getByLabelText("Regular Expression"),
        "(https?://example\\.org/.*)",
      );
      await selectType(user, "Scene");

      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith({
        name: "My Site",
        category_id: null,
        description: "A description",
        url: "https://example.org",
        regex: "(https?://example\\.org/.*)",
        valid_types: [ValidSiteTypeEnum.SCENE],
      });
    });

    it("requires at least one site type", async () => {
      const callback = vi.fn();
      const { user } = render(<SiteForm callback={callback} />);
      await user.type(screen.getByPlaceholderText("Name"), "X");
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(
        await screen.findByText("At least one site type is required"),
      ).toBeInTheDocument();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("edit", () => {
    it("changes name", async () => {
      const callback = vi.fn();
      const { user } = render(<SiteForm site={baseSite} callback={callback} />);
      const nameInput = screen.getByPlaceholderText("Name");
      await user.clear(nameInput);
      await user.type(nameInput, "Renamed");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Renamed" }),
      );
    });

    it("changes description", async () => {
      const callback = vi.fn();
      const { user } = render(<SiteForm site={baseSite} callback={callback} />);
      const desc = screen.getByPlaceholderText("Description");
      await user.clear(desc);
      await user.type(desc, "New desc");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ description: "New desc" }),
      );
    });

    it("changes url", async () => {
      const callback = vi.fn();
      const { user } = render(<SiteForm site={baseSite} callback={callback} />);
      const url = screen.getByPlaceholderText("URL");
      await user.clear(url);
      await user.type(url, "https://changed.org");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ url: "https://changed.org" }),
      );
    });

    it("changes regex", async () => {
      const callback = vi.fn();
      const { user } = render(<SiteForm site={baseSite} callback={callback} />);
      const regex = screen.getByLabelText("Regular Expression");
      await user.clear(regex);
      await user.type(regex, "(new-regex)");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ regex: "(new-regex)" }),
      );
    });

    it("adds a site type", async () => {
      const callback = vi.fn();
      const { user } = render(<SiteForm site={baseSite} callback={callback} />);
      await selectType(user, "Performer");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          valid_types: expect.arrayContaining([
            ValidSiteTypeEnum.SCENE,
            ValidSiteTypeEnum.PERFORMER,
          ]),
        }),
      );
    });
  });

  describe("validation", () => {
    it("requires name", async () => {
      const callback = vi.fn();
      const { user } = render(<SiteForm callback={callback} />);
      await selectType(user, "Scene");
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(await screen.findByText("Name is required")).toBeInTheDocument();
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
