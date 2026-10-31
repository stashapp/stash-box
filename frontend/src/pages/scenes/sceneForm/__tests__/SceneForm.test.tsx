import { screen, waitFor } from "@testing-library/react";
import { GenderEnum, type SceneFragment } from "src/graphql";
import {
  configMock,
  performerSearchMock,
  sitesMock,
  studioSearchMock,
  tagSearchMock,
} from "src/test/graphqlMocks";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it, vi } from "vitest";
import SceneForm from "../SceneForm";

vi.mock("src/components/editImages", () => ({
  default: () => <div data-testid="edit-images" />,
}));
vi.mock("src/components/editCard/ModifyEdit", async (orig) => {
  const real =
    (await orig()) as typeof import("src/components/editCard/ModifyEdit");
  return {
    ...real,
    renderSceneDetails: () => <div data-testid="render-scene-details" />,
  };
});

const studioMock = studioSearchMock("MyStudio", [
  { id: "stu-mystudio", name: "MyStudio" },
]);
const otherStudioMock = studioSearchMock("OtherStudio", [
  { id: "stu-other", name: "OtherStudio" },
]);
const tagMock = tagSearchMock("mytag", [
  { id: "tag-1", name: "mytag", description: null, aliases: [] },
]);
const performerMock = performerSearchMock("Alice", [
  {
    id: "perf-alice",
    name: "Alice",
    gender: GenderEnum.FEMALE,
    disambiguation: null,
    aliases: [],
    deleted: false,
  },
]);
const performerMockNoStudio = performerSearchMock("Bob", [
  {
    id: "perf-bob",
    name: "Bob",
    gender: GenderEnum.MALE,
    disambiguation: null,
    aliases: [],
    deleted: false,
  },
]);

const mocks = [
  configMock,
  sitesMock,
  studioMock,
  otherStudioMock,
  tagMock,
  performerMock,
  performerMockNoStudio,
];

const baseScene: SceneFragment = {
  id: "s-1",
  title: "Original Title",
  details: "Original Details",
  release_date: "2024-01-01",
  production_date: "2023-12-01",
  duration: 3600,
  director: "Original Director",
  code: "CODE-1",
  studio: { id: "stu-existing", name: "Existing Studio", parent: null },
  performers: [],
  tags: [],
  urls: [],
  images: [],
} as unknown as SceneFragment;

const gotoConfirm = async (user: ReturnType<typeof renderForm>["user"]) => {
  await user.click(screen.getByRole("tab", { name: "Confirm" }));
};

const fillNote = async (user: ReturnType<typeof renderForm>["user"]) => {
  const textarea = document.querySelector(
    'textarea[name="note"]',
  ) as HTMLTextAreaElement;
  await user.type(textarea, "edit note");
};

const submit = async (user: ReturnType<typeof renderForm>["user"]) => {
  await gotoConfirm(user);
  await fillNote(user);
  await user.click(screen.getByRole("button", { name: "Submit Edit" }));
};

const containerFor = (labelText: string) => {
  const label = screen
    .getAllByText(labelText)
    .find((el) => el.tagName === "LABEL");
  return (label?.closest(".mb-3") ?? label?.parentElement) as HTMLElement;
};

/** Search via a react-select Async typeahead and pick a result. The 400ms
 *  debounce in TagSelect/SearchField + Apollo round-trip can exceed the
 *  default 1000ms `findBy*` timeout, so we wait longer here. */
const typeaheadPick = async (
  user: ReturnType<typeof renderForm>["user"],
  container: HTMLElement,
  term: string,
  optionText: string,
) => {
  const input = container.querySelector(
    ".react-select__input",
  ) as HTMLInputElement;
  await user.click(input);
  await user.type(input, term);
  const option = await screen.findByText(
    optionText,
    { selector: "[class*='react-select__option'] *" },
    { timeout: 3000 },
  );
  await user.click(option);
};

const lastCallback = (cb: ReturnType<typeof vi.fn>) => cb.mock.calls[0][0];

const renderCreate = (callback = vi.fn()) =>
  renderForm(<SceneForm callback={callback} saving={false} />, { mocks });

const renderEdit = (callback = vi.fn(), scene = baseScene) =>
  renderForm(<SceneForm scene={scene} callback={callback} saving={false} />, {
    mocks,
  });

describe("SceneForm", () => {
  describe("create", () => {
    it("submits with every field filled in", async () => {
      const callback = vi.fn();
      const { user } = renderCreate(callback);

      await user.type(screen.getByPlaceholderText("Title"), "New Scene");
      const dateInputs = screen.getAllByPlaceholderText("YYYY-MM-DD");
      await user.type(dateInputs[0], "2024-06-01");
      await user.type(dateInputs[1], "2024-05-01");
      await user.type(screen.getByPlaceholderText("Duration"), "1:30:00");
      await user.type(screen.getByPlaceholderText("Director"), "Some Director");
      await user.type(screen.getByPlaceholderText(/Unique code/), "CODE-NEW");
      await user.type(screen.getByPlaceholderText("Details"), "Scene details");

      const studioContainer = containerFor("Studio");
      await typeaheadPick(user, studioContainer, "MyStudio", "MyStudio");

      // Tag
      await typeaheadPick(user, containerFor("Tags"), "mytag", "mytag");

      // Performer
      await typeaheadPick(
        user,
        document.querySelector(".add-performer") as HTMLElement,
        "Alice",
        "Alice",
      );

      // Links tab
      await user.click(screen.getByRole("tab", { name: "Links" }));
      const siteSelect = (await waitFor(() => {
        const el = document.querySelector(".URLInput select");
        if (!el) throw new Error("URLInput not ready");
        return el;
      })) as HTMLSelectElement;
      await user.selectOptions(siteSelect, "site-scene-1");
      const urlInput = document.querySelector(
        '.URLInput input[placeholder="URL"]',
      ) as HTMLInputElement;
      await user.type(urlInput, "https://scene.example");
      await user.click(screen.getByRole("button", { name: "Add" }));

      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      const data = lastCallback(callback);
      expect(data).toMatchObject({
        title: "New Scene",
        date: "2024-06-01",
        production_date: "2024-05-01",
        duration: 5400,
        director: "Some Director",
        code: "CODE-NEW",
        details: "Scene details",
        studio_id: "stu-mystudio",
      });
      expect(data.tag_ids).toEqual(["tag-1"]);
      expect(data.performers).toEqual([
        { performer_id: "perf-alice", as: null },
      ]);
      expect(data.urls).toEqual([
        { url: "https://scene.example", site_id: "site-scene-1" },
      ]);
    });
  });

  describe("modify", () => {
    it("changes title", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const title = screen.getByPlaceholderText("Title");
      await user.clear(title);
      await user.type(title, "Renamed Scene");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ title: "Renamed Scene" });
    });

    it("changes release date", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const date = screen.getAllByPlaceholderText("YYYY-MM-DD")[0];
      await user.clear(date);
      await user.type(date, "2025-05-05");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ date: "2025-05-05" });
    });

    it("changes production date", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const prodDate = screen.getAllByPlaceholderText("YYYY-MM-DD")[1];
      await user.clear(prodDate);
      await user.type(prodDate, "2022-01-01");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        production_date: "2022-01-01",
      });
    });

    it("changes duration", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const duration = screen.getByPlaceholderText("Duration");
      await user.clear(duration);
      await user.type(duration, "2:00:00");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ duration: 7200 });
    });

    it("changes director", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const dir = screen.getByPlaceholderText("Director");
      await user.clear(dir);
      await user.type(dir, "New Dir");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ director: "New Dir" });
    });

    it("changes studio code", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const code = screen.getByPlaceholderText(/Unique code/);
      await user.clear(code);
      await user.type(code, "NEW-CODE");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ code: "NEW-CODE" });
    });

    it("changes details", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const details = screen.getByPlaceholderText("Details");
      await user.clear(details);
      await user.type(details, "Brand new details");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        details: "Brand new details",
      });
    });

    it("changes studio", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await typeaheadPick(
        user,
        containerFor("Studio"),
        "OtherStudio",
        "OtherStudio",
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ studio_id: "stu-other" });
    });

    it("adds a tag", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await typeaheadPick(user, containerFor("Tags"), "mytag", "mytag");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).tag_ids).toEqual(["tag-1"]);
    });

    it("adds a performer (searches under the existing scene studio)", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await typeaheadPick(
        user,
        document.querySelector(".add-performer") as HTMLElement,
        "Alice",
        "Alice",
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).performers).toEqual([
        { performer_id: "perf-alice", as: null },
      ]);
    });

    it("removes a performer", async () => {
      const callback = vi.fn();
      const scene = {
        ...baseScene,
        performers: [
          {
            performer: {
              id: "perf-x",
              name: "Existing",
              gender: GenderEnum.FEMALE,
              disambiguation: null,
              deleted: false,
              aliases: [],
            },
            as: null,
          },
        ],
      } as unknown as SceneFragment;
      const { user } = renderEdit(callback, scene);
      const removeBtn = screen.getByRole("button", { name: "Remove" });
      await user.click(removeBtn);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).performers).toEqual([]);
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
      await user.selectOptions(siteSelect, "site-scene-1");
      const urlInput = document.querySelector(
        '.URLInput input[placeholder="URL"]',
      ) as HTMLInputElement;
      await user.type(urlInput, "https://added.example");
      await user.click(screen.getByRole("button", { name: "Add" }));
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).urls).toEqual([
        { url: "https://added.example", site_id: "site-scene-1" },
      ]);
    });
  });

  describe("zero out", () => {
    it("clears details", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const details = screen.getByPlaceholderText("Details");
      await user.clear(details);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).details).toBe("");
    });

    it("clears production_date", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const prodDate = screen.getAllByPlaceholderText("YYYY-MM-DD")[1];
      await user.clear(prodDate);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).production_date).toBeNull();
    });

    it("clears duration", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const duration = screen.getByPlaceholderText("Duration");
      await user.clear(duration);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).duration).toBeNull();
    });

    it("clears director", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const dir = screen.getByPlaceholderText("Director");
      await user.clear(dir);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).director).toBeNull();
    });

    it("clears code", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const code = screen.getByPlaceholderText(/Unique code/);
      await user.clear(code);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).code).toBeNull();
    });
  });

  describe("validation", () => {
    it("blocks submit when title is missing", async () => {
      const callback = vi.fn();
      const { user } = renderCreate(callback);
      const dateInputs = screen.getAllByPlaceholderText("YYYY-MM-DD");
      await user.type(dateInputs[0], "2024-06-01");
      await typeaheadPick(user, containerFor("Studio"), "MyStudio", "MyStudio");
      await submit(user);
      const matches = await screen.findAllByText("Title is required");
      expect(matches.length).toBeGreaterThan(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("blocks submit when date is missing", async () => {
      const callback = vi.fn();
      const { user } = renderCreate(callback);
      await user.type(screen.getByPlaceholderText("Title"), "X");
      await typeaheadPick(user, containerFor("Studio"), "MyStudio", "MyStudio");
      await submit(user);
      const matches = await screen.findAllByText("Release date is required");
      expect(matches.length).toBeGreaterThan(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("blocks submit when studio is missing", async () => {
      const callback = vi.fn();
      const { user } = renderCreate(callback);
      await user.type(screen.getByPlaceholderText("Title"), "X");
      const dateInputs = screen.getAllByPlaceholderText("YYYY-MM-DD");
      await user.type(dateInputs[0], "2024-06-01");
      await submit(user);
      const matches = await screen.findAllByText("Studio is required");
      expect(matches.length).toBeGreaterThan(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("blocks submit when duration is malformed", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const duration = screen.getByPlaceholderText("Duration");
      await user.clear(duration);
      await user.type(duration, "abc");
      await submit(user);
      const matches = await screen.findAllByText(/Invalid duration/);
      expect(matches.length).toBeGreaterThan(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("blocks submit when edit note is missing", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await gotoConfirm(user);
      await user.click(screen.getByRole("button", { name: "Submit Edit" }));
      expect(
        await screen.findByText("Edit note is required"),
      ).toBeInTheDocument();
      expect(callback).not.toHaveBeenCalled();
    });

    it("blocks submit when a URL is entered but not added", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.click(screen.getByRole("tab", { name: "Links" }));
      const urlInput = (await waitFor(() => {
        const el = document.querySelector('.URLInput input[placeholder="URL"]');
        if (!el) throw new Error("URLInput not ready");
        return el;
      })) as HTMLInputElement;
      await user.type(urlInput, "https://pending.example");
      await submit(user);
      const matches = await screen.findAllByText(
        "Click Add to include the entered URL before submitting",
      );
      expect(matches.length).toBeGreaterThan(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("disables submit when saving=true", async () => {
      const { user } = renderForm(
        <SceneForm scene={baseScene} callback={vi.fn()} saving={true} />,
        { mocks },
      );
      await gotoConfirm(user);
      expect(
        screen.getByRole("button", { name: "Submit Edit" }),
      ).toBeDisabled();
    });
  });
});
