import React from "react";
import { getCountryByISO } from 'src/utils/country';

import {
  Edits_queryEdits_edits_details as Details,
  Edits_queryEdits_edits_target as Target,
} from "src/definitions/Edits";
import ChangeRow from "src/components/changeRow";
import {
  isTagTarget,
  isTagCreate,
  isPerformerCreate,
  isPerformerTarget,
} from "./utils";

interface ModifyEditProps {
  details?: Details | null;
  target?: Target | null;
}

const ModifyEdit: React.FC<ModifyEditProps> = ({ details, target }) => {
  if (!details) return null;

  const hasTarget = !!target;

  if (isTagCreate(details) && isTagTarget(target)) {
    return (
      <div>
        <ChangeRow
          name="Name"
          newValue={details.name}
          oldValue={target?.name}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Description"
          newValue={details.description}
          oldValue={target?.description}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Added Aliases"
          newValue={details.added_aliases?.join(", ")}
          oldValue=""
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Removed Aliases"
          newValue={details.removed_aliases?.join(", ")}
          oldValue=""
          showDiff={hasTarget}
        />
      </div>
    );
  }

  if (isPerformerCreate(details) && isPerformerTarget(target)) {
    return (
      <div>
        <ChangeRow
          name="Name"
          newValue={details.name}
          oldValue={target?.name}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Disambiguation"
          newValue={details.disambiguation}
          oldValue={target?.disambiguation}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Aliases"
          newValue={details.added_aliases?.join(", ")}
          oldValue={details.removed_aliases?.join(", ")}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Gender"
          newValue={details.gender}
          oldValue={target?.gender}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Birthdate"
          newValue={details.birthdate}
          oldValue={target?.birthdate?.date}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Eye Color"
          newValue={details.eye_color}
          oldValue={target?.eye_color}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Hair Color"
          newValue={details.hair_color}
          oldValue={target?.hair_color}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Height"
          newValue={details.height}
          oldValue={target?.height}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Breast Type"
          newValue={details.breast_type}
          oldValue={target?.breast_type}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Bra Size"
          newValue={`${details.band_size ?? ''}${details.cup_size ?? ''}`}
          oldValue={`${target?.measurements.band_size ?? ''}${target?.measurements.cup_size ?? ''}`}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Waist Size"
          newValue={details.waist_size}
          oldValue={target?.measurements.waist}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Hip Size"
          newValue={details.hip_size}
          oldValue={target?.measurements.hip}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Nationality"
          newValue={getCountryByISO(details.country)}
          oldValue={getCountryByISO(target?.country)}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Ethnicity"
          newValue={details.ethnicity}
          oldValue={target?.ethnicity}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Career Start"
          newValue={details.career_start_year}
          oldValue={target?.career_start_year}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Career End"
          newValue={details.career_end_year}
          oldValue={target?.career_end_year}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Tattoos"
          newValue={(details?.added_tattoos ?? []).map(tatt => `${tatt.location}: ${tatt.description}`).join('\n')}
          oldValue={(details?.removed_tattoos ?? []).map(tatt => `${tatt.location}: ${tatt.description}`).join('\n')}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Piercings"
          newValue={(details?.added_piercings ?? []).map(piercing => `${piercing.location}: ${piercing.description}`).join('\n')}
          oldValue={(details?.removed_piercings ?? []).map(piercing => `${piercing.location}: ${piercing.description}`).join('\n')}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="ImageIDs"
          newValue={(details?.added_images ?? []).join('\n')}
          oldValue={(details?.removed_images ?? []).join('\n')}
          showDiff={hasTarget}
        />
      </div>
    );
  }

  return null;
};

export default ModifyEdit;
