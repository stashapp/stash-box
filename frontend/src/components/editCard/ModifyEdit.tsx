import React from "react";

import {
  Edits_queryEdits_edits_details as Details,
  Edits_queryEdits_edits_old_details as OldDetails,
} from "src/definitions/Edits";
import {
  getCountryByISO,
  isTagDetails,
  isPerformerDetails,
  isTagOldDetails,
  isPerformerOldDetails,
} from 'src/utils';
import ChangeRow from "src/components/changeRow";
import ImageChangeRow from "src/components/imageChangeRow";
import CategoryChangeRow from "src/components/categoryChangeRow";

interface ModifyEditProps {
  details: Details | null;
  oldDetails?: OldDetails | null;
}

const ModifyEdit: React.FC<ModifyEditProps> = ({ details, oldDetails }) => {
  if (!details) return null;

  const showDiff = !!oldDetails;

  if (
    isTagDetails(details) &&
    (isTagOldDetails(oldDetails) || oldDetails === undefined)
  ) {
    return (
      <>
        <ChangeRow
          name="Name"
          newValue={details.name}
          oldValue={oldDetails?.name}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Description"
          newValue={details.description}
          oldValue={oldDetails?.description}
          showDiff={showDiff}
        />
        <CategoryChangeRow
          newCategoryID={details.category_id}
          oldCategory={oldDetails?.category?.name}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Added Aliases"
          newValue={details.added_aliases?.join(", ")}
          oldValue=""
          showDiff={showDiff}
        />
        <ChangeRow
          name="Removed Aliases"
          newValue={details.removed_aliases?.join(", ")}
          oldValue=""
          showDiff={showDiff}
        />
      </>
    );
  }

  if (
    isPerformerDetails(details) &&
    (isPerformerOldDetails(oldDetails) || oldDetails === undefined)
  ) {
    return (
      <>
        {details.name && (
          <ChangeRow
            name="Name"
            newValue={details.name}
            oldValue={oldDetails?.name}
            showDiff={showDiff}
          />
        )}
        <ChangeRow
          name="Disambiguation"
          newValue={details.disambiguation}
          oldValue={oldDetails?.disambiguation}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Aliases"
          newValue={details.added_aliases?.join(", ")}
          oldValue={details.removed_aliases?.join(", ")}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Gender"
          newValue={details.gender}
          oldValue={oldDetails?.gender}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Birthdate"
          newValue={details.birthdate}
          oldValue={oldDetails?.birthdate}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Eye Color"
          newValue={details.eye_color}
          oldValue={oldDetails?.eye_color}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Hair Color"
          newValue={details.hair_color}
          oldValue={oldDetails?.hair_color}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Height"
          newValue={details.height}
          oldValue={oldDetails?.height}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Breast Type"
          newValue={details.breast_type}
          oldValue={oldDetails?.breast_type}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Bra Size"
          newValue={`${details.band_size || ""}${details.cup_size ?? ""}`}
          oldValue={`${oldDetails?.band_size || ""}${
            oldDetails?.cup_size ?? ""
          }`}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Waist Size"
          newValue={details.waist_size}
          oldValue={oldDetails?.waist_size}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Hip Size"
          newValue={details.hip_size}
          oldValue={oldDetails?.hip_size}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Nationality"
          newValue={getCountryByISO(details.country)}
          oldValue={getCountryByISO(oldDetails?.country)}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Ethnicity"
          newValue={details.ethnicity}
          oldValue={oldDetails?.ethnicity}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Career Start"
          newValue={details.career_start_year}
          oldValue={oldDetails?.career_start_year}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Career End"
          newValue={details.career_end_year}
          oldValue={oldDetails?.career_end_year}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Tattoos"
          newValue={(details?.added_tattoos ?? [])
            .map((tatt) => `${tatt.location}: ${tatt.description}`)
            .join("\n")}
          oldValue={(details?.removed_tattoos ?? [])
            .map((tatt) => `${tatt.location}: ${tatt.description}`)
            .join("\n")}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Piercings"
          newValue={(details?.added_piercings ?? [])
            .map((piercing) => `${piercing.location}: ${piercing.description}`)
            .join("\n")}
          oldValue={(details?.removed_piercings ?? [])
            .map((piercing) => `${piercing.location}: ${piercing.description}`)
            .join("\n")}
          showDiff={showDiff}
        />
        <ImageChangeRow
          newImages={details?.added_images}
          oldImages={details?.removed_images}
        />
      </>
    );
  }

  return null;
};

export default ModifyEdit;
