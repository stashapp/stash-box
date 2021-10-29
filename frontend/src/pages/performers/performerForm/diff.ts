import { isEqual } from "lodash-es";

import { BodyModificationInput, BreastTypeEnum } from "src/graphql";
import { Performer_findPerformer as Performer } from "src/graphql/definitions/Performer";
import { ChangeRowProps } from "src/components/changeRow/ChangeRow";
import { formatFuzzyDate } from "src/utils";
import { CastedPerformerFormData } from "./PerformerForm";

const diffArray = (
  name: string,
  original: (string | number)[] | null,
  updated: (string | number)[] | null | undefined
) => {
  const arrA = original ?? [];
  const arrB = updated ?? [];

  if (isEqual(arrA, arrB)) return null;

  const removed = arrA.filter((x) => !arrB.includes(x));
  const added = arrB.filter((x) => !arrA.includes(x));

  return {
    name,
    newValue: added.join(", "),
    oldValue: removed.join(", "),
    showDiff: true,
  };
};

type BodyModFormData = {
  location?: string;
  description?: string | null;
};

const diffBodyMod = (
  name: string,
  original: BodyModificationInput[] | null,
  updated: BodyModFormData[] | null | undefined
) => {
  const arrA = (original ?? []).map(
    (b) => `${b.location}${b.description ? ": " : ""}${b.description || ""}`
  );
  const arrB = (updated ?? []).map(
    (b) => `${b.location}${b.description ? ": " : ""}${b.description || ""}`
  );

  if (isEqual(arrA, arrB)) return null;

  const removed = arrA.filter((x) => !arrB.includes(x));
  const added = arrB.filter((x) => !arrA.includes(x));

  return {
    name,
    newValue: added.join("\n"),
    oldValue: removed.join("\n"),
    showDiff: true,
  };
};

const diffValue = (
  name: string,
  original: string | number | null | undefined,
  updated: string | number | null | undefined
) => {
  const valueA = original || null;
  const valueB = updated || null;

  if (valueA !== valueB) {
    return {
      name,
      oldValue: valueA,
      newValue: valueB,
      showDiff: true,
    };
  }
  return null;
};

const DiffPerformer = (
  original: Performer,
  updated: CastedPerformerFormData
): ChangeRowProps[] => {
  const changes = [];

  changes.push(diffValue("Name", original.name, updated.name));
  changes.push(
    diffValue("Disambiguation", original.disambiguation, updated.disambiguation)
  );
  changes.push(
    diffArray(
      "Aliases",
      original.aliases,
      (updated.aliases?.filter((a) => a) ?? []) as string[]
    )
  );
  changes.push(diffValue("Gender", original.gender, updated.gender));
  changes.push(
    diffValue(
      "Birthdate",
      formatFuzzyDate(original.birthdate),
      updated.birthdate
    )
  );
  changes.push(diffValue("Eye Color", original.eye_color, updated.eye_color));
  changes.push(
    diffValue("Hair Color", original.hair_color, updated.hair_color)
  );
  changes.push(diffValue("Height", original.height, updated.height));
  changes.push(
    diffValue(
      "Breast Type",
      original.breast_type,
      updated.boobJob === undefined ? BreastTypeEnum.NA : updated.boobJob
    )
  );
  changes.push(
    diffValue(
      "Bra Size",
      `${original.measurements.band_size ?? ""}${
        original.measurements.cup_size ?? ""
      }`,
      updated.braSize
    )
  );
  changes.push(
    diffValue("Waist Size", original.measurements.waist, updated.waistSize)
  );
  changes.push(
    diffValue("Hip Size", original.measurements.hip, updated.hipSize)
  );
  changes.push(diffValue("Nationality", original.country, updated.country));
  changes.push(diffValue("Ethnicity", original.ethnicity, updated.ethnicity));
  changes.push(
    diffValue(
      "Career Start",
      original.career_start_year,
      updated.career_start_year
    )
  );
  changes.push(
    diffValue("Career End", original.career_end_year, updated.career_end_year)
  );
  changes.push(diffBodyMod("Tattoos", original.tattoos, updated.tattoos));
  changes.push(diffBodyMod("Piercings", original.piercings, updated.piercings));
  changes.push(
    diffArray(
      "ImageIDs",
      original.images.map((i) => i.id),
      (updated.images ?? []).map((i) => i.id ?? "")
    )
  );

  return changes.flatMap((c) => (c === null ? [] : [c]));
};

export default DiffPerformer;
