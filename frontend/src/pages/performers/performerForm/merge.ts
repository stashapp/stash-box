import Countries from "i18n-iso-countries";
import english from "i18n-iso-countries/langs/en.json";
import { uniq, uniqBy } from "lodash-es";
import type { MergeConflict } from "src/components/mergeConflicts";
import {
  BreastTypes,
  EthnicityTypes,
  EyeColorTypes,
  GenderTypes,
  HairColorTypes,
} from "src/constants";
import type { PerformerFragment as Performer } from "src/graphql";
import type { PerformerFormData } from "./schema";
import type { InitialPerformer } from "./types";

Countries.registerLocale(english);

type Scalar = string | number;

export type PerformerMergeConflict = MergeConflict<keyof PerformerFormData>;

const stringKey = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

// Single-value fields, mapping each performer property to its form field,
// the InitialPerformer key used to seed defaults, and a display formatter.
interface ScalarField {
  field: keyof PerformerFormData;
  initialKey: keyof InitialPerformer;
  label: string;
  get: (p: Performer) => Scalar | null | undefined;
  display: (value: Scalar) => string;
}

const asString = (value: Scalar) => String(value);

const SCALAR_FIELDS: ScalarField[] = [
  {
    field: "disambiguation",
    initialKey: "disambiguation",
    label: "Disambiguation",
    get: (p) => p.disambiguation,
    display: asString,
  },
  {
    field: "gender",
    initialKey: "gender",
    label: "Gender",
    get: (p) => p.gender,
    display: (v) => GenderTypes[v as keyof typeof GenderTypes] ?? asString(v),
  },
  {
    field: "birthdate",
    initialKey: "birthdate",
    label: "Birthdate",
    get: (p) => p.birth_date,
    display: asString,
  },
  {
    field: "deathdate",
    initialKey: "deathdate",
    label: "Deathdate",
    get: (p) => p.death_date,
    display: asString,
  },
  {
    field: "eye_color",
    initialKey: "eye_color",
    label: "Eye Color",
    get: (p) => p.eye_color,
    display: (v) =>
      EyeColorTypes[v as keyof typeof EyeColorTypes] ?? asString(v),
  },
  {
    field: "hair_color",
    initialKey: "hair_color",
    label: "Hair Color",
    get: (p) => p.hair_color,
    display: (v) =>
      HairColorTypes[v as keyof typeof HairColorTypes] ?? asString(v),
  },
  {
    field: "height",
    initialKey: "height",
    label: "Height",
    get: (p) => p.height,
    display: (v) => `${v} cm`,
  },
  {
    field: "breastType",
    initialKey: "breast_type",
    label: "Breast Type",
    get: (p) => p.breast_type,
    display: (v) => BreastTypes[v as keyof typeof BreastTypes] ?? asString(v),
  },
  {
    field: "bandSize",
    initialKey: "band_size",
    label: "Band Size",
    get: (p) => p.band_size,
    display: asString,
  },
  {
    field: "cupSize",
    initialKey: "cup_size",
    label: "Cup Size",
    get: (p) => p.cup_size,
    display: asString,
  },
  {
    field: "waistSize",
    initialKey: "waist_size",
    label: "Waist Size",
    get: (p) => p.waist_size,
    display: asString,
  },
  {
    field: "hipSize",
    initialKey: "hip_size",
    label: "Hip Size",
    get: (p) => p.hip_size,
    display: asString,
  },
  {
    field: "country",
    initialKey: "country",
    label: "Nationality",
    get: (p) => p.country,
    display: (v) => Countries.getName(asString(v), "en") ?? asString(v),
  },
  {
    field: "ethnicity",
    initialKey: "ethnicity",
    label: "Ethnicity",
    get: (p) => p.ethnicity,
    display: (v) =>
      EthnicityTypes[v as keyof typeof EthnicityTypes] ?? asString(v),
  },
  {
    field: "career_start_year",
    initialKey: "career_start_year",
    label: "Career Start",
    get: (p) => p.career_start_year,
    display: asString,
  },
  {
    field: "career_end_year",
    initialKey: "career_end_year",
    label: "Career End",
    get: (p) => p.career_end_year,
    display: asString,
  },
];

const isSet = (value: Scalar | null | undefined): value is Scalar =>
  value !== null && value !== undefined && value !== "";

const bodyModKey = (mod: { location: string; description?: string | null }) =>
  `${mod.location}-${mod.description ?? ""}`;

// Builds the seed values and detected conflicts for merging the sources into
// the target. Empty target fields are filled from the first source that has a
// value; multi-value fields are combined; single-value fields that differ
// across performers are returned as conflicts for the user to resolve.
export const buildPerformerMerge = (
  target: Performer,
  sources: Performer[],
): { initial: InitialPerformer; conflicts: PerformerMergeConflict[] } => {
  const all = [target, ...sources];
  const initial: InitialPerformer = {};
  const conflicts: PerformerMergeConflict[] = [];

  for (const def of SCALAR_FIELDS) {
    const values = all.map(def.get);

    const merged = values.find(isSet);
    if (merged !== undefined) {
      // biome-ignore lint/suspicious/noExplicitAny: Heterogeneous field types
      (initial as Record<string, any>)[def.initialKey] = merged;
    }

    const distinct = uniq(values.filter(isSet));
    if (distinct.length > 1) {
      conflicts.push({
        field: def.field,
        label: def.label,
        currentKey: stringKey,
        options: distinct.map((value) => ({
          key: String(value),
          value,
          display: def.display(value),
          sources: all.filter((p) => def.get(p) === value).map((p) => p.name),
        })),
      });
    }
  }

  initial.aliases = uniq(
    [
      ...target.aliases,
      ...sources.map((p) => p.name.trim()),
      ...sources.flatMap((p) => p.aliases),
    ].filter((name) => name !== target.name.trim()),
  );
  initial.images = uniqBy(
    all.flatMap((p) => p.images),
    (image) => image.id,
  );
  initial.urls = uniqBy(
    all.flatMap((p) => p.urls),
    (url) => `${url.url}-${url.site.id}`,
  );
  initial.tattoos = uniqBy(
    all.flatMap((p) => p.tattoos ?? []),
    bodyModKey,
  );
  initial.piercings = uniqBy(
    all.flatMap((p) => p.piercings ?? []),
    bodyModKey,
  );

  return { initial, conflicts };
};
