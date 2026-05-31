import {
  BreastTypeEnum,
  EthnicityEnum,
  EyeColorEnum,
  GenderEnum,
  HairColorEnum,
  type PerformerFragment,
} from "src/graphql/types";
import { describe, expect, it } from "vitest";
import { buildPerformerMerge } from "../merge";

const site = (id: string) => ({
  id,
  name: `site-${id}`,
  icon: `icon-${id}`,
});

const image = (id: string) => ({
  id,
  url: `url-${id}`,
  width: 100,
  height: 100,
});

const performer = (
  id: string,
  overrides: Record<string, unknown> = {},
): PerformerFragment =>
  ({
    id,
    name: `name-${id}`,
    disambiguation: null,
    gender: null,
    birth_date: null,
    death_date: null,
    career_start_year: null,
    career_end_year: null,
    height: null,
    band_size: null,
    cup_size: null,
    waist_size: null,
    hip_size: null,
    breast_type: null,
    country: null,
    ethnicity: null,
    eye_color: null,
    hair_color: null,
    aliases: [],
    urls: [],
    images: [],
    tattoos: [],
    piercings: [],
    ...overrides,
  }) as unknown as PerformerFragment;

describe("buildPerformerMerge", () => {
  it("fills empty target fields from the first source with a value", () => {
    const target = performer("target");
    const source = performer("source", {
      gender: GenderEnum.FEMALE,
      birth_date: "1990-01-01",
      height: 170,
      country: "US",
    });

    const { initial } = buildPerformerMerge(target, [source]);

    expect(initial.gender).toBe(GenderEnum.FEMALE);
    expect(initial.birthdate).toBe("1990-01-01");
    expect(initial.height).toBe(170);
    expect(initial.country).toBe("US");
  });

  it("prefers the target value when it is set", () => {
    const target = performer("target", { birth_date: "1990-01-01" });
    const source = performer("source", { birth_date: "1985-05-05" });

    const { initial } = buildPerformerMerge(target, [source]);

    expect(initial.birthdate).toBe("1990-01-01");
  });

  it("combines and dedupes multi-value fields", () => {
    const target = performer("target", {
      name: "Jane",
      aliases: ["JD"],
      images: [image("a")],
      urls: [{ url: "https://x", site: site("1") }],
      tattoos: [{ location: "arm", description: "rose" }],
    });
    const source = performer("source", {
      name: "Janie",
      aliases: ["JD", "J"],
      images: [image("a"), image("b")],
      urls: [{ url: "https://x", site: site("1") }],
      tattoos: [
        { location: "arm", description: "rose" },
        { location: "leg", description: null },
      ],
    });

    const { initial } = buildPerformerMerge(target, [source]);

    // Source name becomes an alias, deduped, target name excluded.
    expect(initial.aliases).toEqual(["JD", "Janie", "J"]);
    expect(initial.images?.map((i) => i.id)).toEqual(["a", "b"]);
    expect(initial.urls).toHaveLength(1);
    expect(initial.tattoos).toHaveLength(2);
  });

  it("reports conflicts for differing single-value fields", () => {
    const target = performer("target", {
      name: "Target",
      birth_date: "1990-01-01",
      gender: GenderEnum.FEMALE,
    });
    const source = performer("source", {
      name: "Source",
      birth_date: "1985-05-05",
      gender: GenderEnum.FEMALE,
    });

    const { conflicts } = buildPerformerMerge(target, [source]);

    // Only birthdate differs; gender matches so it is not a conflict.
    expect(conflicts).toHaveLength(1);
    const [conflict] = conflicts;
    expect(conflict.field).toBe("birthdate");
    expect(conflict.options).toHaveLength(2);
    expect(conflict.options[0]).toEqual({
      key: "1990-01-01",
      value: "1990-01-01",
      display: "1990-01-01",
      sources: ["Target"],
    });
    expect(conflict.options[1].sources).toEqual(["Source"]);
  });

  it("does not report a conflict when only one performer has a value", () => {
    const target = performer("target");
    const source = performer("source", { height: 170 });

    const { conflicts } = buildPerformerMerge(target, [source]);

    expect(conflicts).toHaveLength(0);
  });

  it("uses human-readable display labels for enum conflicts", () => {
    const target = performer("target", { hair_color: HairColorEnum.BLONDE });
    const source = performer("source", { hair_color: HairColorEnum.BLACK });

    const { conflicts } = buildPerformerMerge(target, [source]);

    const hairConflict = conflicts.find((c) => c.field === "hair_color");
    expect(hairConflict?.options.map((o) => o.display)).toEqual([
      "Blond",
      "Black",
    ]);
  });

  it("groups multiple sources sharing the same conflicting value", () => {
    const target = performer("target", {
      ethnicity: EthnicityEnum.CAUCASIAN,
      breast_type: BreastTypeEnum.NATURAL,
      eye_color: EyeColorEnum.BLUE,
    });
    const a = performer("a", { ethnicity: EthnicityEnum.ASIAN });
    const b = performer("b", { ethnicity: EthnicityEnum.ASIAN });

    const { conflicts } = buildPerformerMerge(target, [a, b]);

    const ethnicity = conflicts.find((c) => c.field === "ethnicity");
    const asian = ethnicity?.options.find((o) => o.value === "ASIAN");
    expect(asian?.sources).toEqual(["name-a", "name-b"]);
  });
});
