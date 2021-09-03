import React from "react";

import {
  Edits_queryEdits_edits_details as Details,
  Edits_queryEdits_edits_details_PerformerEdit,
  Edits_queryEdits_edits_details_SceneEdit,
  Edits_queryEdits_edits_details_SceneEdit_added_performers,
  Edits_queryEdits_edits_details_StudioEdit,
  Edits_queryEdits_edits_details_TagEdit,
  Edits_queryEdits_edits_old_details as OldDetails,
  Edits_queryEdits_edits_old_details_PerformerEdit,
  Edits_queryEdits_edits_old_details_SceneEdit,
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
  isSceneDetails,
  isSceneOldDetails,
  studioHref,
  performerHref,
  tagHref,
  createHref,
  formatDuration,
} from "src/utils";
import ChangeRow from "src/components/changeRow";
import ImageChangeRow from "src/components/imageChangeRow";
import URLChangeRow from "src/components/urlChangeRow";
import CategoryChangeRow from "src/components/categoryChangeRow";
import {
  GenderIcon,
  Icon,
  PerformerName,
  TagLink,
} from "src/components/fragments";
import { Link } from "react-router-dom";
import { ROUTE_SCENES } from "src/constants";
import { FingerprintAlgorithm } from "src/graphql";
import LinkedChangeRow from "../linkedChangeRow";
import ListChangeRow from "../listChangeRow";

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
        <LinkedChangeRow
          name="Network"
          newName={studioDetails.parent?.name}
          newLink={studioDetails.parent && studioHref(studioDetails.parent)}
          oldName={studioDetails.parent?.name}
          oldLink={
            oldStudioDetails?.parent && studioHref(oldStudioDetails.parent)
          }
          showDiff={showDiff}
        />
        <URLChangeRow
          newURLs={studioDetails.added_urls}
          oldURLs={studioDetails.removed_urls}
          showDiff={showDiff}
        />
        <ImageChangeRow
          newImages={studioDetails?.added_images}
          oldImages={studioDetails?.removed_images}
        />
      </>
    );
  }

  function renderPerformer(
    appearance: Edits_queryEdits_edits_details_SceneEdit_added_performers
  ) {
    return (
      <Link
        key={appearance.performer.id}
        to={performerHref(appearance.performer)}
        className="scene-performer"
      >
        <GenderIcon gender={appearance.performer.gender} />
        <PerformerName performer={appearance.performer} as={appearance.as} />
      </Link>
    );
  }

  function renderTag(tag: { id: string; name: string }) {
    return (
      <li key={tag.name}>
        <TagLink title={tag.name} link={tagHref(tag)} />
      </li>
    );
  }

  function renderFingerprint(fingerprint: {
    hash: string;
    duration: number;
    algorithm: FingerprintAlgorithm;
  }) {
    return (
      <li key={fingerprint.hash}>
        <Link
          to={`${createHref(ROUTE_SCENES)}?fingerprint=${fingerprint.hash}`}
        >
          {fingerprint.algorithm}: {fingerprint.hash}
        </Link>
        <span title={formatDuration(fingerprint.duration)}>
          {" "}
          ({fingerprint.duration})
        </span>
      </li>
    );
  }

  function renderSceneDetails(
    sceneDetails: Edits_queryEdits_edits_details_SceneEdit,
    oldSceneDetails?: Edits_queryEdits_edits_old_details_SceneEdit
  ) {
    return (
      <>
        {sceneDetails.title && (
          <ChangeRow
            name="Title"
            newValue={sceneDetails.title}
            oldValue={oldSceneDetails?.title}
            showDiff={showDiff}
          />
        )}
        <ChangeRow
          name="Date"
          newValue={sceneDetails.date}
          oldValue={oldSceneDetails?.date}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Duration"
          newValue={sceneDetails.duration}
          oldValue={oldSceneDetails?.duration}
          showDiff={showDiff}
        />
        <ListChangeRow
          name="Performers"
          added={sceneDetails.added_performers}
          removed={sceneDetails.removed_performers}
          renderItem={renderPerformer}
          getKey={(o) => o.performer.id}
          showDiff={showDiff}
        />
        <LinkedChangeRow
          name="Studio"
          newName={sceneDetails.studio?.name}
          newLink={sceneDetails.studio && studioHref(sceneDetails.studio)}
          oldName={oldSceneDetails?.studio?.name}
          oldLink={
            oldSceneDetails?.studio && studioHref(oldSceneDetails?.studio)
          }
          showDiff={showDiff}
        />
        <URLChangeRow
          newURLs={sceneDetails.added_urls}
          oldURLs={oldSceneDetails?.removed_urls}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Details"
          newValue={sceneDetails.details}
          oldValue={oldSceneDetails?.details}
          showDiff={showDiff}
        />
        <ChangeRow
          name="Director"
          newValue={sceneDetails.director}
          oldValue={oldSceneDetails?.director}
          showDiff={showDiff}
        />
        <ListChangeRow
          name="Tags"
          added={sceneDetails.added_tags}
          removed={sceneDetails.removed_tags}
          renderItem={renderTag}
          getKey={(o) => o.id}
          showDiff={showDiff}
        />
        <ImageChangeRow
          newImages={sceneDetails?.added_images}
          oldImages={sceneDetails?.removed_images}
          showDiff={showDiff}
        />
        <ListChangeRow
          name="Fingerprints"
          added={sceneDetails.added_fingerprints}
          removed={sceneDetails.removed_fingerprints}
          renderItem={renderFingerprint}
          getKey={(o) => o.hash}
          showDiff={showDiff}
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

  if (
    isSceneDetails(details) &&
    (isSceneOldDetails(oldDetails) || oldDetails === undefined)
  ) {
    return renderSceneDetails(details, oldDetails);
  }

  return null;
};

export default ModifyEdit;
