import { FC } from "react";
import { Row } from "react-bootstrap";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";

import {
  Edits_queryEdits_edits_details as Details,
  Edits_queryEdits_edits_old_details as OldDetails,
  Edits_queryEdits_edits_options as Options,
} from "src/graphql/definitions/Edits";
import {
  FingerprintAlgorithm,
  PerformerFragment,
  GenderEnum,
  EthnicityEnum,
  BreastTypeEnum,
} from "src/graphql";
import {
  formatDuration,
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
  categoryHref,
} from "src/utils";
import { Icon } from "src/components/fragments";
import ChangeRow from "src/components/changeRow";
import ImageChangeRow from "src/components/imageChangeRow";
import URLChangeRow, { URL } from "src/components/urlChangeRow";
import LinkedChangeRow from "../linkedChangeRow";
import ListChangeRow from "../listChangeRow";
import { renderPerformer, renderTag, renderFingerprint } from "./renderEntity";

export interface TagDetails {
  name: string | null;
  description?: string | null;
  category: { id: string; name: string } | null;
  added_aliases?: string[] | null;
  removed_aliases?: string[] | null;
}

const renderTagDetails = (
  tagDetails: TagDetails,
  oldTagDetails: TagDetails | undefined,
  showDiff: boolean
) => (
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
    <LinkedChangeRow
      name="Category"
      newEntity={{
        name: tagDetails.category?.name,
        link: tagDetails.category && categoryHref(tagDetails.category),
      }}
      oldEntity={{
        name: oldTagDetails?.category?.name,
        link: oldTagDetails?.category && categoryHref(oldTagDetails.category),
      }}
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

type BodyMod = {
  location: string;
  description: string | null;
};

type Image = {
  id: string;
  url: string;
};

export interface PerformerDetails {
  name: string | null;
  gender?: GenderEnum | null;
  disambiguation?: string | null;
  birthdate?: string | null;
  birthdate_accuracy?: string | null;
  career_start_year?: number | null;
  career_end_year?: number | null;
  height?: number | null;
  band_size?: number | null;
  cup_size?: string | null;
  waist_size?: number | null;
  hip_size?: number | null;
  breast_type?: BreastTypeEnum | null;
  country?: string | null;
  ethnicity?: EthnicityEnum | null;
  eye_color?: string | null;
  hair_color?: string | null;
  added_tattoos?: BodyMod[] | null;
  removed_tattoos?: BodyMod[] | null;
  added_piercings?: BodyMod[] | null;
  removed_piercings?: BodyMod[] | null;
  added_aliases?: string[] | null;
  removed_aliases?: string[] | null;
  added_images?: Image[] | null;
  removed_images?: Image[] | null;
  added_urls?: URL[] | null;
  removed_urls?: URL[] | null;
  draft_id?: string | null;
}

export const renderPerformerDetails = (
  performerDetails: PerformerDetails,
  oldPerformerDetails: PerformerDetails | undefined,
  showDiff: boolean,
  setModifyAliases = false
) => (
  <>
    {performerDetails.name && (
      <ChangeRow
        name="Name"
        newValue={performerDetails.name}
        oldValue={oldPerformerDetails?.name}
        showDiff={showDiff}
      />
    )}
    {oldPerformerDetails && performerDetails.name !== oldPerformerDetails.name && (
      <div className="d-flex mb-2 align-items-center">
        <Icon
          icon={setModifyAliases ? faCheck : faTimes}
          color={setModifyAliases ? "green" : "red"}
          className="ms-auto"
        />
        <span className="ms-2">Set performance aliases to old name</span>
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
      newValue={(performerDetails.added_tattoos ?? [])
        .map(formatBodyModification)
        .join("\n")}
      oldValue={(performerDetails.removed_tattoos ?? [])
        .map(formatBodyModification)
        .join("\n")}
      showDiff={showDiff}
    />
    <ChangeRow
      name="Piercings"
      newValue={(performerDetails.added_piercings ?? [])
        .map(formatBodyModification)
        .join("\n")}
      oldValue={(performerDetails.removed_piercings ?? [])
        .map(formatBodyModification)
        .join("\n")}
      showDiff={showDiff}
    />
    <URLChangeRow
      newURLs={performerDetails.added_urls}
      oldURLs={performerDetails.removed_urls}
      showDiff={showDiff}
    />
    <ImageChangeRow
      newImages={performerDetails.added_images}
      oldImages={performerDetails.removed_images}
      showDiff={showDiff}
    />
  </>
);

type ScenePerformance = {
  as: string | null;
  performer: Pick<
    PerformerFragment,
    "name" | "id" | "gender" | "name" | "disambiguation" | "deleted"
  >;
};

export interface SceneDetails {
  title: string | null;
  date: string | null;
  duration?: number | null;
  details?: string | null;
  director?: string | null;
  studio: {
    id: string;
    name: string;
  } | null;
  added_performers?: ScenePerformance[] | null;
  removed_performers?: ScenePerformance[] | null;
  added_images?: Image[] | null;
  removed_images?: Image[] | null;
  added_urls?: URL[] | null;
  removed_urls?: URL[] | null;
  added_tags?:
    | {
        id: string;
        name: string;
      }[]
    | null;
  removed_tags?:
    | {
        id: string;
        name: string;
      }[]
    | null;
  added_fingerprints?:
    | {
        algorithm: FingerprintAlgorithm;
        hash: string;
        duration: number;
      }[]
    | null;
  removed_fingerprints?:
    | {
        algorithm: FingerprintAlgorithm;
        hash: string;
        duration: number;
      }[]
    | null;
  draft_id?: string | null;
}

export const renderSceneDetails = (
  sceneDetails: SceneDetails,
  oldSceneDetails: SceneDetails | undefined,
  showDiff: boolean
) => (
  <>
    {sceneDetails.title && (
      <ChangeRow
        name="Title"
        newValue={sceneDetails.title}
        oldValue={oldSceneDetails?.title}
        showDiff={showDiff}
      />
    )}
    {sceneDetails.draft_id && <Row className="mb-2">Submitted by draft</Row>}
    <ChangeRow
      name="Date"
      newValue={sceneDetails.date}
      oldValue={oldSceneDetails?.date}
      showDiff={showDiff}
    />
    <ChangeRow
      name="Duration"
      newValue={formatDuration(sceneDetails.duration)}
      oldValue={formatDuration(oldSceneDetails?.duration)}
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
      newEntity={{
        name: sceneDetails.studio?.name,
        link: sceneDetails.studio && studioHref(sceneDetails.studio),
      }}
      oldEntity={{
        name: oldSceneDetails?.studio?.name,
        link: oldSceneDetails?.studio && studioHref(oldSceneDetails.studio),
      }}
      showDiff={showDiff}
    />
    <URLChangeRow
      newURLs={sceneDetails.added_urls}
      oldURLs={sceneDetails.removed_urls}
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
      getKey={(o) => `${o.hash}${o.algorithm}`}
      showDiff={showDiff}
    />
  </>
);

export interface StudioDetails {
  name: string | null;
  parent: {
    id: string;
    name: string;
  } | null;
  added_images?: Image[] | null;
  removed_images?: Image[] | null;
  added_urls?: URL[] | null;
  removed_urls?: URL[] | null;
}

export const renderStudioDetails = (
  studioDetails: StudioDetails,
  oldStudioDetails: StudioDetails | undefined,
  showDiff: boolean
) => (
  <>
    <ChangeRow
      name="Name"
      newValue={studioDetails.name}
      oldValue={oldStudioDetails?.name}
      showDiff={showDiff}
    />
    <LinkedChangeRow
      name="Network"
      newEntity={{
        name: studioDetails.parent?.name,
        link: studioDetails.parent && studioHref(studioDetails.parent),
      }}
      oldEntity={{
        name: oldStudioDetails?.parent?.name,
        link: oldStudioDetails?.parent && studioHref(oldStudioDetails.parent),
      }}
      showDiff={showDiff}
    />
    <URLChangeRow
      newURLs={studioDetails.added_urls}
      oldURLs={studioDetails.removed_urls}
      showDiff={showDiff}
    />
    <ImageChangeRow
      newImages={studioDetails.added_images}
      oldImages={studioDetails.removed_images}
      showDiff={showDiff}
    />
  </>
);

interface ModifyEditProps {
  details: Details | null;
  oldDetails?: OldDetails | null;
  options?: Options;
}

const ModifyEdit: FC<ModifyEditProps> = ({ details, oldDetails, options }) => {
  if (!details) return null;

  const showDiff = !!oldDetails;

  if (
    isTagDetails(details) &&
    (isTagOldDetails(oldDetails) || oldDetails === undefined)
  ) {
    return renderTagDetails(details, oldDetails, showDiff);
  }

  if (
    isPerformerDetails(details) &&
    (isPerformerOldDetails(oldDetails) || oldDetails === undefined)
  ) {
    return renderPerformerDetails(
      details,
      oldDetails,
      showDiff,
      options?.set_modify_aliases
    );
  }

  if (
    isStudioDetails(details) &&
    (isStudioOldDetails(oldDetails) || oldDetails === undefined)
  ) {
    return renderStudioDetails(details, oldDetails, showDiff);
  }

  if (
    isSceneDetails(details) &&
    (isSceneOldDetails(oldDetails) || oldDetails === undefined)
  ) {
    return renderSceneDetails(details, oldDetails, showDiff);
  }

  return null;
};

export default ModifyEdit;
