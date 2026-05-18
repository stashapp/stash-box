import { screen, waitFor } from "@testing-library/react";
import type { TagFragment } from "src/graphql";
import { categoriesMock, configMock } from "src/test/graphqlMocks";
import { renderForm } from "src/test/renderForm";
import {
  addCreatableOption,
  removeMultiValue,
  selectReactSelect,
} from "src/test/selectors";
import { describe, expect, it, vi } from "vitest";
import TagForm from "../TagForm";

const selectCategory = async (
  user: ReturnType<typeof renderForm>["user"],
  label: string,
) => {
  const labels = screen.getAllByText("Category");
  const labelEl = labels.find((el) => el.tagName === "LABEL") ?? labels[0];
  const categoryGroup = labelEl.closest(".mb-3") as HTMLElement;
  await selectReactSelect(user, label, categoryGroup);
};

const aliasContainer = () => {
  const labels = screen.getAllByText("Aliases");
  const labelEl = labels.find((el) => el.tagName === "LABEL") ?? labels[0];
  return labelEl.closest(".mb-3") as HTMLElement;
};

const baseTag: TagFragment = {
  __typename: "Tag",
  id: "t-1",
  name: "OriginalTag",
  description: "desc",
  aliases: ["alpha", "beta"],
  deleted: false,
  category: { __typename: "TagCategory", id: "cat-1", name: "Activity" },
} as TagFragment;

const waitForLoad = async () => {
  await waitFor(
    () => expect(screen.queryByText(/Loading/)).not.toBeInTheDocument(),
    { timeout: 1000 },
  );
};

const fillNote = async (user: ReturnType<typeof renderForm>["user"]) => {
  const textarea = document.querySelector(
    'textarea[name="note"]',
  ) as HTMLTextAreaElement;
  await user.type(textarea, "test edit note");
};

const setupCreate = async (callback = vi.fn()) => {
  const utils = renderForm(<TagForm callback={callback} saving={false} />, {
    mocks: [categoriesMock, configMock],
  });
  await waitForLoad();
  return { callback, ...utils };
};

const setupEdit = async (callback = vi.fn()) => {
  const utils = renderForm(
    <TagForm tag={baseTag} callback={callback} saving={false} />,
    { mocks: [categoriesMock, configMock] },
  );
  await waitForLoad();
  return { callback, ...utils };
};

describe("TagForm", () => {
  describe("create", () => {
    it("submits with all fields filled", async () => {
      const { callback, user } = await setupCreate();
      await user.type(screen.getByPlaceholderText("Name"), "MyTag");
      await user.type(
        screen.getByPlaceholderText("Description"),
        "a description",
      );
      await addCreatableOption(user, "alt1", aliasContainer());
      await addCreatableOption(user, "alt2", aliasContainer());
      await selectCategory(user, "Activity");
      await fillNote(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));

      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith(
        {
          name: "MyTag",
          description: "a description",
          aliases: ["alt1", "alt2"],
          category_id: "cat-1",
        },
        "test edit note",
      );
    });

    it("submits with only the required fields", async () => {
      const { callback, user } = await setupCreate();
      await user.type(screen.getByPlaceholderText("Name"), "Minimal");
      await fillNote(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0]).toMatchObject({
        name: "Minimal",
        aliases: [],
      });
    });
  });

  describe("modify", () => {
    it("changes name", async () => {
      const { callback, user } = await setupEdit();
      const name = screen.getByPlaceholderText("Name");
      await user.clear(name);
      await user.type(name, "RenamedTag");
      await fillNote(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0]).toMatchObject({ name: "RenamedTag" });
    });

    it("changes description", async () => {
      const { callback, user } = await setupEdit();
      const desc = screen.getByPlaceholderText("Description");
      await user.clear(desc);
      await user.type(desc, "new desc");
      await fillNote(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0]).toMatchObject({
        description: "new desc",
      });
    });

    it("changes category", async () => {
      const { callback, user } = await setupEdit();
      await selectCategory(user, "Other");
      await fillNote(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0]).toMatchObject({
        category_id: "cat-2",
      });
    });

    it("adds an alias", async () => {
      const { callback, user } = await setupEdit();
      await addCreatableOption(user, "gamma", aliasContainer());
      await fillNote(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0].aliases).toEqual([
        "alpha",
        "beta",
        "gamma",
      ]);
    });

    it("removes an alias", async () => {
      const { callback, user } = await setupEdit();
      await removeMultiValue(user, "beta", aliasContainer());
      await fillNote(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0].aliases).toEqual(["alpha"]);
    });
  });

  describe("zero out", () => {
    it("clears description (sends null)", async () => {
      const { callback, user } = await setupEdit();
      const desc = screen.getByPlaceholderText("Description");
      await user.clear(desc);
      await fillNote(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0]).toMatchObject({ description: null });
    });

    it("removes all aliases", async () => {
      const { callback, user } = await setupEdit();
      await removeMultiValue(user, "alpha", aliasContainer());
      await removeMultiValue(user, "beta", aliasContainer());
      await fillNote(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0].aliases).toEqual([]);
    });
  });

  describe("validation", () => {
    it("requires name", async () => {
      const { callback, user } = await setupCreate();
      await fillNote(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      expect(await screen.findByText("Name is required")).toBeInTheDocument();
      expect(callback).not.toHaveBeenCalled();
    });

    it("requires edit note", async () => {
      const { callback, user } = await setupCreate();
      await user.type(screen.getByPlaceholderText("Name"), "Tag");
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      expect(
        await screen.findByText("Edit note is required"),
      ).toBeInTheDocument();
      expect(callback).not.toHaveBeenCalled();
    });

    it("disables submit when saving=true", async () => {
      renderForm(<TagForm callback={vi.fn()} saving={true} />, {
        mocks: [categoriesMock, configMock],
      });
      await waitForLoad();
      expect(
        screen.getByRole("button", { name: "Submit Edit" }),
      ).toBeDisabled();
    });
  });
});
