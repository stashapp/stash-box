import {
  BreastTypeEnum,
  EthnicityEnum,
  EyeColorEnum,
  GenderEnum,
  HairColorEnum,
  type PerformerFragment,
} from "src/graphql/types";
import { describe, expect, it } from "vitest";
import selectPerformerDetails from "../diff";
import type { PerformerFormData } from "../schema";

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

const basePerformer = (
  overrides: Partial<PerformerFragment> = {},
): PerformerFragment =>
  ({
    id: "p-1",
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
    urls: [{ url: "https://a", site: site("1") }],
    images: [image("img-1")],
    tattoos: [{ location: "arm", description: "rose" }],
    piercings: [{ location: "ear", description: null }],
    ...overrides,
  }) as unknown as PerformerFragment;

const baseFormData = (
  overrides: Partial<PerformerFormData> = {},
): PerformerFormData =>
  ({
    name: "Jane Doe",
    disambiguation: "actress",
    gender: GenderEnum.FEMALE,
    birthdate: "1990-01-01",
    deathdate: null,
    career_start_year: 2010,
    career_end_year: null,
    height: 170,
    bandSize: 32,
    cupSize: "C",
    waistSize: 24,
    hipSize: 34,
    breastType: BreastTypeEnum.NATURAL,
    country: "US",
    ethnicity: EthnicityEnum.CAUCASIAN,
    eye_color: EyeColorEnum.BLUE,
    hair_color: HairColorEnum.BLONDE,
    aliases: ["JD"],
    urls: [{ url: "https://a", site: site("1") }],
    images: [image("img-1")],
    tattoos: [{ location: "arm", description: "rose" }],
    piercings: [{ location: "ear", description: null }],
    note: "n",
    ...overrides,
  }) as unknown as PerformerFormData;

describe("selectPerformerDetails", () => {
  it("no diff when unchanged", () => {
    const [old, neu] = selectPerformerDetails(baseFormData(), basePerformer());
    for (const k of Object.keys(old) as Array<keyof typeof old>) {
      expect(old[k]).toBeNull();
    }
    expect(neu.added_aliases).toEqual([]);
    expect(neu.removed_aliases).toEqual([]);
    expect(neu.added_urls).toEqual([]);
    expect(neu.removed_urls).toEqual([]);
    expect(neu.added_images).toEqual([]);
    expect(neu.removed_images).toEqual([]);
    expect(neu.added_tattoos).toEqual([]);
    expect(neu.removed_tattoos).toEqual([]);
    expect(neu.added_piercings).toEqual([]);
    expect(neu.removed_piercings).toEqual([]);
  });

  it.each([
    ["name", "Jane Doe", "Janet"],
    ["disambiguation", "actress", "model"],
    ["birthdate", "1990-01-01", "1991-05-05"],
    ["country", "US", "UK"],
  ] as const)("diffs %s scalar", (key, oldVal, newVal) => {
    const fdKey =
      key === "birthdate" ? ("birthdate" as const) : (key as "name");
    const [old, neu] = selectPerformerDetails(
      baseFormData({ [fdKey]: newVal } as Partial<PerformerFormData>),
      basePerformer(),
    );
    const lookupOld = key === "birthdate" ? "birthdate" : key;
    expect((old as unknown as Record<string, unknown>)[lookupOld]).toBe(oldVal);
    expect((neu as unknown as Record<string, unknown>)[lookupOld]).toBe(newVal);
  });

  it("diffs gender via genderEnum", () => {
    const [old, neu] = selectPerformerDetails(
      baseFormData({ gender: GenderEnum.MALE }),
      basePerformer(),
    );
    expect(old.gender).toBe(GenderEnum.FEMALE);
    expect(neu.gender).toBe(GenderEnum.MALE);
  });

  it("diffs deathdate (null → set)", () => {
    const [old, neu] = selectPerformerDetails(
      baseFormData({ deathdate: "2020-06-01" }),
      basePerformer(),
    );
    expect(old.deathdate).toBeNull();
    expect(neu.deathdate).toBe("2020-06-01");
  });

  it("diffs height, cup, band, waist, hip", () => {
    const [old, neu] = selectPerformerDetails(
      baseFormData({
        height: 180,
        bandSize: 34,
        cupSize: "D",
        waistSize: 26,
        hipSize: 36,
      }),
      basePerformer(),
    );
    expect(old.height).toBe(170);
    expect(neu.height).toBe(180);
    expect(neu.band_size).toBe(34);
    expect(neu.cup_size).toBe("D");
    expect(neu.waist_size).toBe(26);
    expect(neu.hip_size).toBe(36);
  });

  it("upper-cases cup size", () => {
    const [, neu] = selectPerformerDetails(
      baseFormData({ cupSize: "d" }),
      basePerformer(),
    );
    expect(neu.cup_size).toBe("D");
  });

  it("diffs breast_type", () => {
    const [old, neu] = selectPerformerDetails(
      baseFormData({ breastType: BreastTypeEnum.FAKE }),
      basePerformer(),
    );
    expect(old.breast_type).toBe(BreastTypeEnum.NATURAL);
    expect(neu.breast_type).toBe(BreastTypeEnum.FAKE);
  });

  it("diffs ethnicity, eye_color, hair_color", () => {
    const [old, neu] = selectPerformerDetails(
      baseFormData({
        ethnicity: EthnicityEnum.ASIAN,
        eye_color: EyeColorEnum.BROWN,
        hair_color: HairColorEnum.BLACK,
      }),
      basePerformer(),
    );
    expect(old.ethnicity).toBe(EthnicityEnum.CAUCASIAN);
    expect(neu.ethnicity).toBe(EthnicityEnum.ASIAN);
    expect(old.eye_color).toBe(EyeColorEnum.BLUE);
    expect(neu.eye_color).toBe(EyeColorEnum.BROWN);
    expect(old.hair_color).toBe(HairColorEnum.BLONDE);
    expect(neu.hair_color).toBe(HairColorEnum.BLACK);
  });

  it("diffs aliases add/remove", () => {
    const [, neu] = selectPerformerDetails(
      baseFormData({ aliases: ["Janie"] }),
      basePerformer(),
    );
    expect(neu.added_aliases).toEqual(["Janie"]);
    expect(neu.removed_aliases).toEqual(["JD"]);
  });

  it("diffs urls add/remove", () => {
    const [, neu] = selectPerformerDetails(
      baseFormData({
        urls: [
          { url: "https://a", site: site("1") },
          { url: "https://new", site: site("2") },
        ],
      }),
      basePerformer(),
    );
    expect(neu.added_urls).toEqual([{ url: "https://new", site: site("2") }]);
    expect(neu.removed_urls).toEqual([]);
  });

  it("diffs images add/remove", () => {
    const [, neu] = selectPerformerDetails(
      baseFormData({ images: [image("img-2")] }),
      basePerformer(),
    );
    expect(neu.added_images).toEqual([image("img-2")]);
    expect(neu.removed_images).toEqual([image("img-1")]);
  });

  it("diffs tattoos add/remove", () => {
    const [, neu] = selectPerformerDetails(
      baseFormData({
        tattoos: [{ location: "leg", description: null }],
      }),
      basePerformer(),
    );
    expect(neu.added_tattoos).toEqual([{ location: "leg", description: null }]);
    expect(neu.removed_tattoos).toEqual([
      { location: "arm", description: "rose" },
    ]);
  });

  it("diffs piercings add/remove", () => {
    const [, neu] = selectPerformerDetails(
      baseFormData({
        piercings: [{ location: "nose", description: null }],
      }),
      basePerformer(),
    );
    expect(neu.added_piercings).toEqual([
      { location: "nose", description: null },
    ]);
    expect(neu.removed_piercings).toEqual([
      { location: "ear", description: null },
    ]);
  });

  it("handles null original (create flow)", () => {
    const [old, neu] = selectPerformerDetails(baseFormData(), null);
    expect(old.name).toBeNull();
    expect(neu.name).toBe("Jane Doe");
    expect(neu.added_aliases).toEqual(["JD"]);
  });
});
