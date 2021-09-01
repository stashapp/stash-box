import React from "react";

import {
  Edits_queryEdits_edits_details as Details,
  Edits_queryEdits_edits_details_PerformerEdit,
  Edits_queryEdits_edits_details_StudioEdit,
  Edits_queryEdits_edits_details_TagEdit,
  Edits_queryEdits_edits_old_details as OldDetails,
  Edits_queryEdits_edits_old_details_PerformerEdit,
  Edits_queryEdits_edits_old_details_StudioEdit,
  Edits_queryEdits_edits_old_details_TagEdit,
  Edits_queryEdits_edits_options as Options,
} from "src/graphql/definitions/Edits";
import {
  getCountryByISO,
  isTagDetails,
  isPerformerDetails,
  isTagOldDetails,
  isPerformerOldDetails,
  formatBodyModification,
  formatFuzzyDateComponents,
  isStudioDetails,
  isStudioOldDetails,
} from "src/utils";
import ChangeRow from "src/components/changeRow";
import ImageChangeRow from "src/components/imageChangeRow";
import URLChangeRow from "src/components/urlChangeRow";
import CategoryChangeRow from "src/components/categoryChangeRow";
import { Icon } from "src/components/fragments";
import StudioChangeRow from "../studioChangeRow";

interface ModifyEditProps {
  details: Details | null;
  oldDetails?: OldDetails | null;
  options?: Options;
}

const ModifyEdit: React.FC<ModifyEditProps> = ({
  details,
  oldDetails,
  options,
}) => {
  if (!details) return null;

  const showDiff = !!oldDetails;

  function renderTagDetails(
    tagDetails: Edits_queryEdits_edits_details_TagEdit,
    oldTagDetails?: Edits_queryEdits_edits_old_details_TagEdit
  ) {
    return (
      <>
        <ChangeRow
          name="Name"
          newValue={tagDetails.name}
          oldValue={oldTagDetails?.name}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Description"
          newValue={tagDetails.description}
          oldValue={oldTagDetails?.description}
          showDiff={showDiff}
        />
        <CategoryChangeRow
          newCategoryID={tagDetails.category_id}
          oldCategoryID={oldTagDetails?.category_id}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Added Aliases"
          newValue={tagDetails.added_aliases?.join(", ")}
          oldValue=""
          showDiff={showDiff}
        />
        <ChangeRow
          name="Removed Aliases"
          newValue={tagDetails.removed_aliases?.join(", ")}
          oldValue=""
          showDiff={showDiff}
        />
      </>
    );
  }

  function renderPerformerDetails(
    performerDetails: Edits_queryEdits_edits_details_PerformerEdit,
    oldPerformerDetails?: Edits_queryEdits_edits_old_details_PerformerEdit
  ) {
    return (
      <>
        {performerDetails.name && (
          <ChangeRow
            name="Name"
            newValue={performerDetails.name}
            oldValue={oldPerformerDetails?.name}
            showDiff={showDiff}
          />
        )}
        {oldPerformerDetails &&
          performerDetails.name !== oldPerformerDetails.name && (
            <div className="d-flex mb-2 align-items-center">
              <Icon
                icon={options?.set_modify_aliases ? "check" : "times"}
                color={options?.set_modify_aliases ? "green" : "red"}
                className="ml-auto"
              />
              <span className="ml-2">Set performance aliases to old name</span>
            </div>
          )}
        <ChangeRow
          name="Disambiguation"
          newValue={performerDetails.disambiguation}
          oldValue={oldPerformerDetails?.disambiguation}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Aliases"
          newValue={performerDetails.added_aliases?.join(", ")}
          oldValue={performerDetails.removed_aliases?.join(", ")}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Gender"
          newValue={performerDetails.gender}
          oldValue={oldPerformerDetails?.gender}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Birthdate"
          newValue={formatFuzzyDateComponents(
            performerDetails.birthdate,
            performerDetails.birthdate_accuracy
          )}
          oldValue={formatFuzzyDateComponents(
            oldPerformerDetails?.birthdate,
            oldPerformerDetails?.birthdate_accuracy
          )}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Eye Color"
          newValue={performerDetails.eye_color}
          oldValue={oldPerformerDetails?.eye_color}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Hair Color"
          newValue={performerDetails.hair_color}
          oldValue={oldPerformerDetails?.hair_color}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Height"
          newValue={performerDetails.height}
          oldValue={oldPerformerDetails?.height}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Breast Type"
          newValue={performerDetails.breast_type}
          oldValue={oldPerformerDetails?.breast_type}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Bra Size"
          newValue={`${performerDetails.band_size || ""}${
            performerDetails.cup_size ?? ""
          }`}
          oldValue={`${oldPerformerDetails?.band_size || ""}${
            oldPerformerDetails?.cup_size ?? ""
          }`}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Waist Size"
          newValue={performerDetails.waist_size}
          oldValue={oldPerformerDetails?.waist_size}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Hip Size"
          newValue={performerDetails.hip_size}
          oldValue={oldPerformerDetails?.hip_size}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Nationality"
          newValue={getCountryByISO(performerDetails.country)}
          oldValue={getCountryByISO(oldPerformerDetails?.country)}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Ethnicity"
          newValue={performerDetails.ethnicity}
          oldValue={oldPerformerDetails?.ethnicity}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Career Start"
          newValue={performerDetails.career_start_year}
          oldValue={oldPerformerDetails?.career_start_year}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Career End"
          newValue={performerDetails.career_end_year}
          oldValue={oldPerformerDetails?.career_end_year}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Tattoos"
          newValue={(performerDetails?.added_tattoos ?? [])
            .map(formatBodyModification)
            .join("\n")}
          oldValue={(performerDetails?.removed_tattoos ?? [])
            .map(formatBodyModification)
            .join("\n")}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Piercings"
          newValue={(performerDetails?.added_piercings ?? [])
            .map(formatBodyModification)
            .join("\n")}
          oldValue={(performerDetails?.removed_piercings ?? [])
            .map(formatBodyModification)
            .join("\n")}
          showDiff={showDiff}
        />
        <ImageChangeRow
          newImages={performerDetails?.added_images}
          oldImages={performerDetails?.removed_images}
        />
      </>
    );
  }

  function renderStudioDetails(
    studioDetails: Edits_queryEdits_edits_details_StudioEdit,
    oldStudioDetails?: Edits_queryEdits_edits_old_details_StudioEdit
  ) {
    return (
      <>
        <ChangeRow
          name="Name"
          newValue={studioDetails.name}
          oldValue={oldStudioDetails?.name}
          showDiff={showDiff}
        />
        <StudioChangeRow
          newStudioID={studioDetails.parent?.id}
          oldStudioID={oldStudioDetails?.parent?.id}
          showDiff={showDiff}
        />
        <URLChangeRow
          newURLs={studioDetails.added_urls}
          oldURLs={studioDetails.removed_urls}
        />
        <ImageChangeRow
          newImages={studioDetails?.added_images}
          oldImages={studioDetails?.removed_images}
        />
      </>
    );
  }

  if (
    isTagDetails(details) &&
    (isTagOldDetails(oldDetails) || oldDetails === undefined)
  ) {
    return renderTagDetails(details, oldDetails);
  }

  if (
    isPerformerDetails(details) &&
    (isPerformerOldDetails(oldDetails) || oldDetails === undefined)
  ) {
    return renderPerformerDetails(details, oldDetails);
  }

  if (
    isStudioDetails(details) &&
    (isStudioOldDetails(oldDetails) || oldDetails === undefined)
  ) {
    return renderStudioDetails(details, oldDetails);
  }

  return null;
};

export default ModifyEdit;
