import { screen, waitFor } from "@testing-library/react";
import {
  BreastTypeEnum,
  EthnicityEnum,
  EyeColorEnum,
  GenderEnum,
  HairColorEnum,
  type PerformerFragment,
} from "src/graphql";
import { configMock, sitesMock } from "src/test/graphqlMocks";
import { renderForm } from "src/test/renderForm";
import {
  addCreatableOption,
  removeMultiValue,
  selectReactSelect,
} from "src/test/selectors";
import { describe, expect, it, vi } from "vitest";
import PerformerForm from "../PerformerForm";

// EditImages can't be exercised in jsdom (file uploads), and the read-only
// summary on the Confirm tab isn't useful for these tests.
vi.mock("src/components/editImages", () => ({
  default: () => <div data-testid="edit-images" />,
}));
vi.mock("src/components/editCard/ModifyEdit", async (orig) => {
  const real =
    (await orig()) as typeof import("src/components/editCard/ModifyEdit");
  return {
    ...real,
    renderPerformerDetails: () => (
      <div data-testid="render-performer-details" />
    ),
  };
});

const mocks = [configMock, sitesMock];

const fullPerformer: PerformerFragment = {
  id: "perf-1",
  name: "Jane Doe",
  disambiguation: "actress",
  gender: GenderEnum.FEMALE,
  birth_date: "1990-01-01",
  death_date: null,
  career_start_year: 2010,
  career_end_year: null,
  height: 170,
  band_size: 32,
  cup_size: "C",
  waist_size: 24,
  hip_size: 34,
  breast_type: BreastTypeEnum.NATURAL,
  country: "US",
  ethnicity: EthnicityEnum.CAUCASIAN,
  eye_color: EyeColorEnum.BLUE,
  hair_color: HairColorEnum.BLONDE,
  aliases: ["JD"],
  urls: [
    {
      url: "https://example.org/jane",
      site: {
        id: "site-perf-1",
        name: "PerfSite",
        icon: "x",
      },
    },
  ],
  images: [],
  tattoos: [{ location: "arm", description: "rose" }],
  piercings: [{ location: "ear", description: null }],
} as unknown as PerformerFragment;

const gotoConfirm = async (user: ReturnType<typeof renderForm>["user"]) => {
  await user.click(screen.getByRole("tab", { name: "Confirm" }));
};

const fillNote = async (user: ReturnType<typeof renderForm>["user"]) => {
  const textarea = document.querySelector(
    'textarea[name="note"]',
  ) as HTMLTextAreaElement;
  await user.type(textarea, "note");
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

const renderCreate = (callback = vi.fn()) =>
  renderForm(<PerformerForm callback={callback} saving={false} isCreate />, {
    mocks,
  });

const renderEdit = (callback = vi.fn(), performer = fullPerformer) =>
  renderForm(
    <PerformerForm performer={performer} callback={callback} saving={false} />,
    { mocks },
  );

const lastCallback = (cb: ReturnType<typeof vi.fn>) => cb.mock.calls[0][0];

describe("PerformerForm", () => {
  describe("create", () => {
    it("submits with every field filled in", async () => {
      const callback = vi.fn();
      const { user } = renderCreate(callback);

      await user.type(screen.getByLabelText("Name"), "New Person");
      await user.type(screen.getByLabelText("Disambiguation"), "the second");
      await user.selectOptions(
        screen.getByLabelText("Gender"),
        GenderEnum.FEMALE,
      );
      await user.type(screen.getByLabelText("Birthdate"), "1995-03-10");
      await user.type(screen.getByLabelText("Deathdate"), "2024-09-09");
      await user.selectOptions(
        screen.getByLabelText("Eye Color"),
        EyeColorEnum.BROWN,
      );
      await user.selectOptions(
        screen.getByLabelText("Hair Color"),
        HairColorEnum.BLACK,
      );
      await user.type(screen.getByLabelText("Height"), "170");
      await user.selectOptions(
        screen.getByLabelText("Breast type"),
        BreastTypeEnum.NATURAL,
      );
      await user.type(screen.getByLabelText("Band size"), "32");
      await user.type(screen.getByLabelText("Cup size"), "C");
      await user.type(screen.getByLabelText("Waist size"), "24");
      await user.type(screen.getByLabelText("Hip size"), "34");
      await selectReactSelect(
        user,
        "United States",
        containerFor("Nationality"),
      );
      await user.selectOptions(
        screen.getByLabelText("Ethnicity"),
        EthnicityEnum.CAUCASIAN,
      );
      await user.type(screen.getByLabelText("Career Start"), "2015");
      await user.type(screen.getByLabelText("Career End"), "2024");

      await addCreatableOption(user, "AliasOne", containerFor("Aliases"));

      // Body modifications (tattoos / piercings) tab
      await user.click(
        screen.getByRole("tab", { name: "Tattoos and Piercings" }),
      );
      await addCreatableOption(
        user,
        "shoulder",
        containerFor("tattoos") ?? document.body,
      );
      await addCreatableOption(
        user,
        "nose",
        containerFor("piercings") ?? document.body,
      );

      // Links tab — URLInput
      await user.click(screen.getByRole("tab", { name: "Links" }));
      const siteSelect = (await waitFor(() => {
        const el = document.querySelector(".URLInput select");
        if (!el) throw new Error("URLInput not ready");
        return el;
      })) as HTMLSelectElement;
      await user.selectOptions(siteSelect, "site-perf-1");
      const urlInput = document.querySelector(
        '.URLInput input[placeholder="URL"]',
      ) as HTMLInputElement;
      await user.type(urlInput, "https://example.org/np");
      await user.click(screen.getByRole("button", { name: "Add" }));

      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      const [data, note, updateAliases] = callback.mock.calls[0];
      expect(data).toMatchObject({
        name: "New Person",
        disambiguation: "the second",
        gender: GenderEnum.FEMALE,
        birthdate: "1995-03-10",
        deathdate: "2024-09-09",
        eye_color: EyeColorEnum.BROWN,
        hair_color: HairColorEnum.BLACK,
        height: 170,
        breast_type: BreastTypeEnum.NATURAL,
        band_size: 32,
        cup_size: "C",
        waist_size: 24,
        hip_size: 34,
        country: "US",
        ethnicity: EthnicityEnum.CAUCASIAN,
        career_start_year: 2015,
        career_end_year: 2024,
        aliases: ["AliasOne"],
      });
      expect(data.tattoos).toEqual([{ location: "shoulder" }]);
      expect(data.piercings).toEqual([{ location: "nose" }]);
      expect(data.urls).toEqual([
        { url: "https://example.org/np", site_id: "site-perf-1" },
      ]);
      expect(note).toBe("note");
      // Default for new performers when no options prop is passed.
      expect(updateAliases).toBe(true);
    });
  });

  describe("updateAliases (set_modify_aliases) callback arg", () => {
    it("defaults to true when no options prop is passed", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const name = screen.getByLabelText("Name");
      await user.clear(name);
      await user.type(name, "Janet Doe");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][2]).toBe(true);
    });

    it("flips to false when the user unchecks the indicator on a name change", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const name = screen.getByLabelText("Name");
      await user.clear(name);
      await user.type(name, "Janet Doe");
      // Name change reveals the "Set unset performance aliases…" checkbox
      const checkbox = await screen.findByLabelText(
        /Set unset performance aliases/,
      );
      await user.click(checkbox);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][2]).toBe(false);
    });

    it("respects an explicit options.set_modify_aliases=false", async () => {
      const callback = vi.fn();
      const { user } = renderForm(
        <PerformerForm
          performer={fullPerformer}
          options={{ set_modify_aliases: false }}
          callback={callback}
          saving={false}
        />,
        { mocks },
      );
      const name = screen.getByLabelText("Name");
      await user.clear(name);
      await user.type(name, "Janet Doe");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][2]).toBe(false);
    });
  });

  describe("modify", () => {
    it("changes name", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const name = screen.getByLabelText("Name");
      await user.clear(name);
      await user.type(name, "Janet Doe");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ name: "Janet Doe" });
    });

    it("changes disambiguation", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const dis = screen.getByLabelText("Disambiguation");
      await user.clear(dis);
      await user.type(dis, "model");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ disambiguation: "model" });
    });

    it("changes gender (MALE clears breast_type to NA)", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.selectOptions(
        screen.getByLabelText("Gender"),
        GenderEnum.MALE,
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        gender: GenderEnum.MALE,
        breast_type: BreastTypeEnum.NA,
      });
    });

    it("changes birthdate", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const bd = screen.getByLabelText("Birthdate");
      await user.clear(bd);
      await user.type(bd, "1991-05-05");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ birthdate: "1991-05-05" });
    });

    it("changes deathdate", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const dd = screen.getByLabelText("Deathdate");
      await user.clear(dd);
      await user.type(dd, "2020-12-31");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ deathdate: "2020-12-31" });
    });

    it("changes height", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const h = screen.getByLabelText("Height");
      await user.clear(h);
      await user.type(h, "180");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ height: 180 });
    });

    it("changes eye color", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.selectOptions(
        screen.getByLabelText("Eye Color"),
        EyeColorEnum.BROWN,
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        eye_color: EyeColorEnum.BROWN,
      });
    });

    it("changes hair color", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.selectOptions(
        screen.getByLabelText("Hair Color"),
        HairColorEnum.BLACK,
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        hair_color: HairColorEnum.BLACK,
      });
    });

    it("changes ethnicity", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.selectOptions(
        screen.getByLabelText("Ethnicity"),
        EthnicityEnum.ASIAN,
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        ethnicity: EthnicityEnum.ASIAN,
      });
    });

    it("changes breast type", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.selectOptions(
        screen.getByLabelText("Breast type"),
        BreastTypeEnum.FAKE,
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        breast_type: BreastTypeEnum.FAKE,
      });
    });

    it("changes band, cup, waist, hip", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const band = screen.getByLabelText("Band size");
      await user.clear(band);
      await user.type(band, "34");
      const cup = screen.getByLabelText("Cup size");
      await user.clear(cup);
      await user.type(cup, "D");
      const waist = screen.getByLabelText("Waist size");
      await user.clear(waist);
      await user.type(waist, "26");
      const hip = screen.getByLabelText("Hip size");
      await user.clear(hip);
      await user.type(hip, "36");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        band_size: 34,
        cup_size: "D",
        waist_size: 26,
        hip_size: 36,
      });
    });

    it("changes career start and end years", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const start = screen.getByLabelText("Career Start");
      await user.clear(start);
      await user.type(start, "2015");
      const end = screen.getByLabelText("Career End");
      await user.clear(end);
      await user.type(end, "2024");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({
        career_start_year: 2015,
        career_end_year: 2024,
      });
    });

    it("changes country", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await selectReactSelect(user, "Japan", containerFor("Nationality"));
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)).toMatchObject({ country: "JP" });
    });

    it("adds an alias", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await addCreatableOption(user, "Janie", containerFor("Aliases"));
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).aliases).toEqual(["JD", "Janie"]);
    });

    it("removes an alias", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await removeMultiValue(user, "JD", containerFor("Aliases"));
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).aliases).toEqual([]);
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
      await user.selectOptions(siteSelect, "site-perf-1");
      const urlInput = document.querySelector(
        '.URLInput input[placeholder="URL"]',
      ) as HTMLInputElement;
      await user.type(urlInput, "https://example.org/added");
      await user.click(screen.getByRole("button", { name: "Add" }));
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).urls).toEqual([
        { url: "https://example.org/jane", site_id: "site-perf-1" },
        { url: "https://example.org/added", site_id: "site-perf-1" },
      ]);
    });

    it("removes a URL", async () => {
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

    it("adds a tattoo", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.click(
        screen.getByRole("tab", { name: "Tattoos and Piercings" }),
      );
      await addCreatableOption(
        user,
        "wrist",
        containerFor("tattoos") ?? document.body,
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).tattoos).toEqual([
        { location: "arm", description: "rose" },
        { location: "wrist" },
      ]);
    });

    it("removes a tattoo", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.click(
        screen.getByRole("tab", { name: "Tattoos and Piercings" }),
      );
      const removeButtons = screen.getAllByRole("button", { name: "Remove" });
      // first Remove belongs to the first tattoo row
      await user.click(removeButtons[0]);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).tattoos).toEqual([]);
    });

    it("adds a piercing", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.click(
        screen.getByRole("tab", { name: "Tattoos and Piercings" }),
      );
      await addCreatableOption(
        user,
        "lip",
        containerFor("piercings") ?? document.body,
      );
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).piercings).toEqual([
        { location: "ear", description: null },
        { location: "lip" },
      ]);
    });

    it("removes a piercing", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.click(
        screen.getByRole("tab", { name: "Tattoos and Piercings" }),
      );
      const removeButtons = screen.getAllByRole("button", { name: "Remove" });
      // second Remove is the piercing row (after the single tattoo row)
      await user.click(removeButtons[1]);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).piercings).toEqual([]);
    });
  });

  describe("zero out", () => {
    const clearScalar = async (
      user: ReturnType<typeof renderForm>["user"],
      label: string,
    ) => {
      const el = screen.getByLabelText(label);
      await user.clear(el);
    };

    const cases: Array<[string, string, unknown]> = [
      ["disambiguation", "Disambiguation", null],
      ["birthdate", "Birthdate", null],
      ["height", "Height", null],
      ["career_start_year", "Career Start", null],
      ["band_size", "Band size", null],
      ["cup_size", "Cup size", null],
      ["waist_size", "Waist size", null],
      ["hip_size", "Hip size", null],
    ];

    it.each(cases)("clears %s", async (key, label, expected) => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await clearScalar(user, label);
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback)[key]).toBe(expected);
    });

    it("sets gender to Unknown", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.selectOptions(screen.getByLabelText("Gender"), "null");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).gender).toBeNull();
    });

    it("sets eye color to Unknown", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.selectOptions(screen.getByLabelText("Eye Color"), "null");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).eye_color).toBeNull();
    });

    it("sets hair color to Unknown", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.selectOptions(screen.getByLabelText("Hair Color"), "null");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).hair_color).toBeNull();
    });

    it("sets ethnicity to Unknown", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.selectOptions(screen.getByLabelText("Ethnicity"), "null");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).ethnicity).toBeNull();
    });

    it("sets breast type to Unknown", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await user.selectOptions(screen.getByLabelText("Breast type"), "null");
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).breast_type).toBeNull();
    });

    it("clears nationality (country)", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      await selectReactSelect(user, "Unknown", containerFor("Nationality"));
      await submit(user);
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(lastCallback(callback).country).toBeNull();
    });
  });

  describe("validation", () => {
    it("blocks submit when name is empty", async () => {
      const callback = vi.fn();
      const { user } = renderCreate(callback);
      await user.selectOptions(
        screen.getByLabelText("Gender"),
        GenderEnum.FEMALE,
      );
      await submit(user);
      const matches = await screen.findAllByText("Name is required");
      expect(matches.length).toBeGreaterThan(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("blocks submit on invalid birthdate format", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const bd = screen.getByLabelText("Birthdate");
      await user.clear(bd);
      await user.type(bd, "not-a-date");
      await submit(user);
      const matches = await screen.findAllByText(/Invalid date/);
      expect(matches.length).toBeGreaterThan(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("blocks submit when height is below 100cm", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const h = screen.getByLabelText("Height");
      await user.clear(h);
      await user.type(h, "50");
      await submit(user);
      const matches = await screen.findAllByText(
        /Height must be in centimeters/,
      );
      expect(matches.length).toBeGreaterThan(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("blocks submit when band size outside 28-56", async () => {
      const callback = vi.fn();
      const { user } = renderEdit(callback);
      const band = screen.getByLabelText("Band size");
      await user.clear(band);
      await user.type(band, "100");
      await submit(user);
      const matches = await screen.findAllByText(/Size must be 28-56/);
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
      await user.type(urlInput, "https://example.org/pending");
      await submit(user);
      const matches = await screen.findAllByText(
        "Click Add to include the entered URL before submitting",
      );
      expect(matches.length).toBeGreaterThan(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("hides breast type when gender is MALE", async () => {
      const { user } = renderEdit();
      expect(screen.getByLabelText("Breast type")).toBeInTheDocument();
      await user.selectOptions(
        screen.getByLabelText("Gender"),
        GenderEnum.MALE,
      );
      expect(screen.queryByLabelText("Breast type")).not.toBeInTheDocument();
    });

    it("disables submit when saving=true", async () => {
      const { user } = renderForm(
        <PerformerForm
          performer={fullPerformer}
          callback={vi.fn()}
          saving={true}
        />,
        { mocks },
      );
      await gotoConfirm(user);
      expect(
        screen.getByRole("button", { name: "Submit Edit" }),
      ).toBeDisabled();
    });
  });
});
