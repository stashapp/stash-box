import { screen, waitFor } from "@testing-library/react";
import type { StudioFragment } from "src/graphql";
import { configMock, sitesMock, studioSearchMock } from "src/test/graphqlMocks";
import { renderForm } from "src/test/renderForm";
import { addCreatableOption, removeMultiValue } from "src/test/selectors";
import { describe, expect, it, vi } from "vitest";
import StudioForm from "../StudioForm";

vi.mock("src/components/editImages", () => ({
  default: () => <div data-testid="edit-images" />,
}));
vi.mock("src/components/editCard/ModifyEdit", async (orig) => {
  const real =
    (await orig()) as typeof import("src/components/editCard/ModifyEdit");
  return {
    ...real,
    renderStudioDetails: () => <div data-testid="render-studio-details" />,
  };
});

const networkSearchMock = studioSearchMock("Network", [
  { id: "parent-net-1", name: "Network" },
]);
const mocks = [configMock, sitesMock, networkSearchMock];

const baseStudio: StudioFragment = {
  __typename: "Studio",
  id: "stu-1",
  name: "Studio One",
  aliases: ["alt-a", "alt-b"],
  deleted: false,
  is_favorite: false,
  parent: {
    __typename: "Studio",
    id: "parent-existing",
    name: "Existing Network",
  },
  urls: [
    {
      url: "https://existing.example/studio",
      site: { id: "site-studio-1", name: "StudioSite", icon: "icon" },
    },
  ],
  images: [],
} as unknown as StudioFragment;

const containerFor = (labelText: string) => {
  const label = screen
    .getAllByText(labelText)
    .find((el) => el.tagName === "LABEL");
  return (label?.closest(".mb-3") ?? label?.parentElement) as HTMLElement;
};

const fillNote = async (user: ReturnType<typeof renderForm>["user"]) => {
  const textarea = document.querySelector(
    'textarea[name="note"]',
  ) as HTMLTextAreaElement;
  await user.type(textarea, "note");
};

const gotoConfirm = async (user: ReturnType<typeof renderForm>["user"]) => {
  await user.click(screen.getByRole("tab", { name: "Confirm" }));
};

const submit = async (user: ReturnType<typeof renderForm>["user"]) => {
  await gotoConfirm(user);
  await fillNote(user);
  await user.click(screen.getByRole("button", { name: "Submit Edit" }));
};

const renderCreate = (callback = vi.fn()) =>
  renderForm(<StudioForm callback={callback} saving={false} />, { mocks });

const renderEdit = (callback = vi.fn()) =>
  renderForm(
    <StudioForm studio={baseStudio} callback={callback} saving={false} />,
    { mocks },
  );

const lastCallback = (cb: ReturnType<typeof vi.fn>) => cb.mock.calls[0][0];

describe("StudioForm", () => {
  describe("create", () => {
    it("submits with every field filled in", async () => {
      const callback = vi.fn();
      const { user } = renderCreate(callback);

      await user.type(screen.getByPlaceholderText("Name"), "Brand New Studio");
      await addCreatableOption(user, "BNS", containerFor("Aliases"));

      // Network (parent) — type to trigger search
      const networkContainer = containerFor("Network");
      const networkInput = networkContainer.querySelector(
        ".react-select__input",
      ) as HTMLInputElement;
      await user.click(networkInput);
      await user.type(networkInput, "Network");
      const option = await screen.findByText("Network", {
        selector: "[class*='react-select__option'] *",
      });
      await user.click(option);

      // Links tab
      await user.click(screen.getByRole("tab", { name: "Links" }));
      const siteSelect = (await waitFor(() => {
        const el = document.querySelector(".URLInput select");
        if (!el) throw new Error("URLInput not ready");
        return el;
      })) as HTMLSelectElement;
      await user.selectOptions(siteSelect, "site-studio-1");
      const urlInput = document.querySelector(
        '.URLInput input[placeholder="URL"]',
      ) as HTMLInputElement;
      await user.type(urlInput, "https://new.example");
      await user.click(screen.getByRole("button", { name: "Add" }));

      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        name: "Brand New Studio",
        aliases: ["BNS"],
        parent_id: "parent-net-1",
        urls: [{ url: "https://new.example", site_id: "site-studio-1" }],
        image_ids: [],
      });
    });

    it("submits with just the required name", async () => {
      const callback = vi.fn();
      const { user } = renderCreate(callback);
      await user.type(screen.getByPlaceholderText("Name"), "Minimal");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        name: "Minimal",
        aliases: [],
        urls: [],
        image_ids: [],
        parent_id: null,
      });
    });
  });

  describe("modify", () => {
    it("changes name", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const name = screen.getByPlaceholderText("Name");
      await user.clear(name);
      await user.type(name, "Renamed");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ name: "Renamed" });
    });

    it("adds an alias", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await addCreatableOption(user, "alt-c", containerFor("Aliases"));
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).aliases).toEqual([
        "alt-a",
        "alt-b",
        "alt-c",
      ]);
    });

    it("removes an alias", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await removeMultiValue(user, "alt-b", containerFor("Aliases"));
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).aliases).toEqual(["alt-a"]);
    });

    it("changes network (parent)", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const networkContainer = containerFor("Network");
      const networkInput = networkContainer.querySelector(
        ".react-select__input",
      ) as HTMLInputElement;
      await user.click(networkInput);
      await user.type(networkInput, "Network");
      const option = await screen.findByText("Network", {
        selector: "[class*='react-select__option'] *",
      });
      await user.click(option);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).parent_id).toBe("parent-net-1");
    });

    it("adds a URL", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.click(screen.getByRole("tab", { name: "Links" }));
      const siteSelect = (await waitFor(() => {
        const el = document.querySelector(".URLInput select");
        if (!el) throw new Error("URLInput not ready");
        return el;
      })) as HTMLSelectElement;
      await user.selectOptions(siteSelect, "site-studio-1");
      const urlInput = document.querySelector(
        '.URLInput input[placeholder="URL"]',
      ) as HTMLInputElement;
      await user.type(urlInput, "https://second.example");
      await user.click(screen.getByRole("button", { name: "Add" }));
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).urls).toEqual([
        {
          url: "https://existing.example/studio",
          site_id: "site-studio-1",
        },
        { url: "https://second.example", site_id: "site-studio-1" },
      ]);
    });

    it("removes a URL", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.click(screen.getByRole("tab", { name: "Links" }));
      // Wait for URLInput to finish loading sites and render the URL row.
      const removeBtn = (await waitFor(() => {
        const el = document.querySelector(".URLInput li button.btn-danger");
        if (!el) throw new Error("Remove button not ready");
        return el;
      })) as HTMLButtonElement;
      await user.click(removeBtn);
      await waitFor(() =>
        expect(document.querySelectorAll(".URLInput li")).toHaveLength(0),
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).urls).toEqual([]);
    });
  });

  describe("zero out", () => {
    it("removes all aliases", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await removeMultiValue(user, "alt-a", containerFor("Aliases"));
      await removeMultiValue(user, "alt-b", containerFor("Aliases"));
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).aliases).toEqual([]);
    });

    it("removes all URLs", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.click(screen.getByRole("tab", { name: "Links" }));
      const removeBtn = (await waitFor(() => {
        const el = document.querySelector(".URLInput li button.btn-danger");
        if (!el) throw new Error("Remove button not ready");
        return el;
      })) as HTMLButtonElement;
      await user.click(removeBtn);
      await waitFor(() =>
        expect(document.querySelectorAll(".URLInput li")).toHaveLength(0),
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).urls).toEqual([]);
    });

    it("clears parent network", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const clearBtn = document.querySelector(
        ".StudioSelect .react-select__clear-indicator",
      ) as HTMLElement | null;
      expect(clearBtn).not.toBeNull();
      // biome-ignore lint/style/noNonNullAssertion: presence asserted above
      await user.click(clearBtn!);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).parent_id).toBeNull();
    });
  });

  describe("validation", () => {
    it("blocks submit when name is empty", async () => {
      const callback = vi.fn();
      const { user } = renderCreate(callback);
      await submit(user);
      // Validation fires; the error is rendered both inline next to Name and
      // as a link on the Confirm tab (metadataErrors). Either signal proves it.
      const matches = await screen.findAllByText("Name is required");
      expect(matches.length).toBeGreaterThan(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("blocks submit when edit note is missing", async () => {
      const callback = vi.fn();
      const { user } = renderCreate(callback);
      await user.type(screen.getByPlaceholderText("Name"), "X");
      await gotoConfirm(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      expect(
        await screen.findByText("Edit note is required"),
      ).toBeInTheDocument();
      expect(callback).not.toHaveBeenCalled();
    });

    it("disables submit when saving=true", async () => {
      const { user } = renderForm(
        <StudioForm callback={vi.fn()} saving={true} />,
        { mocks },
      );
      await gotoConfirm(user);
      expect(
        screen.getByRole("button", { name: "Submit Edit" }),
      ).toBeDisabled();
    });

    it("hides network select when showNetworkSelect=false", () => {
      renderForm(
        <StudioForm
          studio={baseStudio}
          callback={vi.fn()}
          saving={false}
          showNetworkSelect={false}
        />,
        { mocks },
      );
      expect(screen.queryByLabelText("Network")).not.toBeInTheDocument();
    });
  });
});
