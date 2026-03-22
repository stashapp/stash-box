import type { FC } from "react";
import { Col, Row } from "react-bootstrap";
import { faCheck, faXmark, faEdit } from "@fortawesome/free-solid-svg-icons";

import type {
  FingerprintAlgorithm,
  PerformerFragment,
  GenderEnum,
  EthnicityEnum,
  BreastTypeEnum,
  EditFragment,
  HairColorEnum,
  EyeColorEnum,
} from "src/graphql";
import {
  formatDuration,
  getCountryByISO,
  isTagEdit,
  isPerformerEdit,
  formatBodyModification,
  isStudioEdit,
  isSceneEdit,
  studioHref,
  categoryHref,
  compareByName,
} from "src/utils";
import {
  EthnicityTypes,
  HairColorTypes,
  EyeColorTypes,
  BreastTypes,
  GenderTypes,
} from "src/constants";
import { Icon } from "src/components/fragments";
import AmendableChangeRow from "./AmendableChangeRow";
import AmendableListChangeRow from "./AmendableListChangeRow";
import AmendableImageChangeRow from "./AmendableImageChangeRow";
import AmendableURLChangeRow from "./AmendableURLChangeRow";
import AmendableLinkedChangeRow from "./AmendableLinkedChangeRow";
import {
  renderPerformer,
  renderTag,
  renderFingerprint,
} from "src/components/editCard/renderEntity";
import type { URL } from "src/components/urlChangeRow";

type Details = EditFragment["details"];
type OldDetails = EditFragment["old_details"];
type Options = EditFragment["options"];

type Image = {
  height: number;
  id: string;
  url: string;
  width: number;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type StartingWith<T, K extends string> = T extends `${K}${infer _}` ? T : never;
type TargetOldDetails<T> = Omit<
  T,
  StartingWith<keyof T, "added_" | "removed_"> | "draft_id"
>;

export interface AmendmentState {
  removedFields: Set<string>;
  removedAddedItems: Map<string, Set<number>>;
  removedRemovedItems: Map<string, Set<number>>;
}

export interface AmendableEditCallbacks {
  onRemoveField: (field: string) => void;
  onRemoveAddedItem: (field: string, index: number) => void;
  onRemoveRemovedItem: (field: string, index: number) => void;
  onRestoreField: (field: string) => void;
  onRestoreAddedItem: (field: string, index: number) => void;
  onRestoreRemovedItem: (field: string, index: number) => void;
}

export interface TagDetails {
  name?: string | null;
  description?: string | null;
  category?: { id: string; name: string } | null;
  added_aliases?: string[] | null;
  removed_aliases?: string[] | null;
}

export type OldTagDetails = TargetOldDetails<TagDetails>;

const renderAmendableTagDetails = (
  tagDetails: TagDetails,
  oldTagDetails: OldTagDetails | undefined,
  showDiff: boolean,
  state: AmendmentState,
  callbacks: AmendableEditCallbacks,
) => (
  <>
    <AmendableChangeRow
      name="Name"
      field="name"
      newValue={tagDetails.name}
      oldValue={oldTagDetails?.name}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("name")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Description"
      field="description"
      newValue={tagDetails.description}
      oldValue={oldTagDetails?.description}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("description")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableLinkedChangeRow
      name="Category"
      field="category_id"
      newEntity={{
        name: tagDetails.category?.name,
        link: tagDetails.category && categoryHref(tagDetails.category),
      }}
      oldEntity={{
        name: oldTagDetails?.category?.name,
        link: oldTagDetails?.category && categoryHref(oldTagDetails.category),
      }}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("category_id")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableListChangeRow
      name="Aliases"
      field="aliases"
      added={tagDetails.added_aliases?.map((a) => ({ value: a }))}
      removed={tagDetails.removed_aliases?.map((a) => ({ value: a }))}
      renderItem={(o) => <>{o.value}</>}
      getKey={(o) => o.value}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("aliases")}
      removedRemovedIndices={state.removedRemovedItems.get("aliases")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
  </>
);

type BodyMod = {
  location: string;
  description?: string | null;
};

export interface PerformerDetails {
  name?: string | null;
  gender?: GenderEnum | null;
  disambiguation?: string | null;
  birthdate?: string | null;
  deathdate?: string | null;
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
  added_images?: (Image | null)[] | null;
  removed_images?: (Image | null)[] | null;
  added_urls?: URL[] | null;
  removed_urls?: URL[] | null;
  draft_id?: string | null;
}

export type OldPerformerDetails = TargetOldDetails<PerformerDetails>;

const renderAmendablePerformerDetails = (
  performerDetails: PerformerDetails,
  oldPerformerDetails: OldPerformerDetails | undefined,
  showDiff: boolean,
  setModifyAliases: boolean,
  state: AmendmentState,
  callbacks: AmendableEditCallbacks,
) => (
  <>
    {performerDetails.name && (
      <AmendableChangeRow
        name="Name"
        field="name"
        newValue={performerDetails.name}
        oldValue={oldPerformerDetails?.name}
        showDiff={showDiff}
        isRemoved={state.removedFields.has("name")}
        onRemove={callbacks.onRemoveField}
        onRestore={callbacks.onRestoreField}
      />
    )}
    {oldPerformerDetails?.name &&
      performerDetails.name !== oldPerformerDetails.name && (
        <div className="d-flex mb-2 align-items-center">
          <Icon
            icon={setModifyAliases ? faCheck : faXmark}
            color={setModifyAliases ? "green" : "red"}
            className="ms-auto"
          />
          <span className="ms-2">Set performance aliases to old name</span>
        </div>
      )}
    <AmendableChangeRow
      name="Disambiguation"
      field="disambiguation"
      newValue={performerDetails.disambiguation}
      oldValue={oldPerformerDetails?.disambiguation}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("disambiguation")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableListChangeRow
      name="Aliases"
      field="aliases"
      added={performerDetails.added_aliases?.map((a) => ({ value: a }))}
      removed={performerDetails.removed_aliases?.map((a) => ({ value: a }))}
      renderItem={(o) => <>{o.value}</>}
      getKey={(o) => o.value}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("aliases")}
      removedRemovedIndices={state.removedRemovedItems.get("aliases")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    <AmendableChangeRow
      name="Gender"
      field="gender"
      newValue={
        performerDetails.gender &&
        GenderTypes[performerDetails.gender as keyof typeof GenderEnum]
      }
      oldValue={
        oldPerformerDetails?.gender &&
        GenderTypes[oldPerformerDetails.gender as keyof typeof GenderEnum]
      }
      showDiff={showDiff}
      isRemoved={state.removedFields.has("gender")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Birthdate"
      field="birthdate"
      newValue={performerDetails.birthdate}
      oldValue={oldPerformerDetails?.birthdate}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("birthdate")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Deathdate"
      field="deathdate"
      newValue={performerDetails.deathdate}
      oldValue={oldPerformerDetails?.deathdate}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("deathdate")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Eye Color"
      field="eye_color"
      newValue={
        performerDetails.eye_color &&
        EyeColorTypes[performerDetails.eye_color as keyof typeof EyeColorEnum]
      }
      oldValue={
        oldPerformerDetails?.eye_color &&
        EyeColorTypes[
          oldPerformerDetails.eye_color as keyof typeof EyeColorEnum
        ]
      }
      showDiff={showDiff}
      isRemoved={state.removedFields.has("eye_color")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Hair Color"
      field="hair_color"
      newValue={
        performerDetails.hair_color &&
        HairColorTypes[
          performerDetails.hair_color as keyof typeof HairColorEnum
        ]
      }
      oldValue={
        oldPerformerDetails?.hair_color &&
        HairColorTypes[
          oldPerformerDetails.hair_color as keyof typeof HairColorEnum
        ]
      }
      showDiff={showDiff}
      isRemoved={state.removedFields.has("hair_color")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Height"
      field="height"
      newValue={performerDetails.height}
      oldValue={oldPerformerDetails?.height}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("height")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Breast Type"
      field="breast_type"
      newValue={
        performerDetails.breast_type &&
        BreastTypes[performerDetails.breast_type as keyof typeof BreastTypeEnum]
      }
      oldValue={
        oldPerformerDetails?.breast_type &&
        BreastTypes[
          oldPerformerDetails.breast_type as keyof typeof BreastTypeEnum
        ]
      }
      showDiff={showDiff}
      isRemoved={state.removedFields.has("breast_type")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Bra Size"
      field="measurements"
      newValue={`${performerDetails.band_size || ""}${
        performerDetails.cup_size ?? ""
      }`}
      oldValue={`${oldPerformerDetails?.band_size || ""}${
        oldPerformerDetails?.cup_size ?? ""
      }`}
      showDiff={showDiff}
      isRemoved={
        state.removedFields.has("band_size") ||
        state.removedFields.has("cup_size")
      }
      onRemove={() => {
        callbacks.onRemoveField("band_size");
        callbacks.onRemoveField("cup_size");
      }}
      onRestore={() => {
        callbacks.onRestoreField("band_size");
        callbacks.onRestoreField("cup_size");
      }}
    />
    <AmendableChangeRow
      name="Waist Size"
      field="waist_size"
      newValue={performerDetails.waist_size}
      oldValue={oldPerformerDetails?.waist_size}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("waist_size")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Hip Size"
      field="hip_size"
      newValue={performerDetails.hip_size}
      oldValue={oldPerformerDetails?.hip_size}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("hip_size")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Nationality"
      field="country"
      newValue={getCountryByISO(performerDetails.country)}
      oldValue={getCountryByISO(oldPerformerDetails?.country)}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("country")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Ethnicity"
      field="ethnicity"
      newValue={
        performerDetails.ethnicity &&
        EthnicityTypes[performerDetails.ethnicity as keyof typeof EthnicityEnum]
      }
      oldValue={
        oldPerformerDetails?.ethnicity &&
        EthnicityTypes[
          oldPerformerDetails.ethnicity as keyof typeof EthnicityEnum
        ]
      }
      showDiff={showDiff}
      isRemoved={state.removedFields.has("ethnicity")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Career Start"
      field="career_start_year"
      newValue={performerDetails.career_start_year}
      oldValue={oldPerformerDetails?.career_start_year}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("career_start_year")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Career End"
      field="career_end_year"
      newValue={performerDetails.career_end_year}
      oldValue={oldPerformerDetails?.career_end_year}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("career_end_year")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableListChangeRow
      name="Tattoos"
      field="tattoos"
      added={performerDetails.added_tattoos}
      removed={performerDetails.removed_tattoos}
      renderItem={(o) => <>{formatBodyModification(o)}</>}
      getKey={(o) => `${o.location}-${o.description ?? ""}`}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("tattoos")}
      removedRemovedIndices={state.removedRemovedItems.get("tattoos")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    <AmendableListChangeRow
      name="Piercings"
      field="piercings"
      added={performerDetails.added_piercings}
      removed={performerDetails.removed_piercings}
      renderItem={(o) => <>{formatBodyModification(o)}</>}
      getKey={(o) => `${o.location}-${o.description ?? ""}`}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("piercings")}
      removedRemovedIndices={state.removedRemovedItems.get("piercings")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    <AmendableURLChangeRow
      field="urls"
      newURLs={performerDetails.added_urls}
      oldURLs={performerDetails.removed_urls}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("urls")}
      removedRemovedIndices={state.removedRemovedItems.get("urls")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    <AmendableImageChangeRow
      field="images"
      newImages={performerDetails.added_images}
      oldImages={performerDetails.removed_images}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("images")}
      removedRemovedIndices={state.removedRemovedItems.get("images")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    {performerDetails.draft_id && (
      <Row className="mb-2">
        <Col xs={{ offset: 2 }}>
          <h6>
            <Icon icon={faEdit} color="green" />
            <span className="ms-1">Submitted by draft</span>
          </h6>
        </Col>
      </Row>
    )}
  </>
);

type ScenePerformance = {
  as?: string | null;
  performer: Pick<
    PerformerFragment,
    "name" | "id" | "gender" | "disambiguation" | "deleted"
  >;
};

export interface SceneDetails {
  title?: string | null;
  date?: string | null;
  production_date?: string | null;
  duration?: number | null;
  details?: string | null;
  director?: string | null;
  code?: string | null;
  studio?: {
    id: string;
    name: string;
  } | null;
  added_performers?: ScenePerformance[] | null;
  removed_performers?: ScenePerformance[] | null;
  added_images?: (Image | null)[] | null;
  removed_images?: (Image | null)[] | null;
  added_urls?: URL[] | null;
  removed_urls?: URL[] | null;
  added_tags?:
    | {
        id: string;
        name: string;
        description?: string | null;
      }[]
    | null;
  removed_tags?:
    | {
        id: string;
        name: string;
        description?: string | null;
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

export type OldSceneDetails = TargetOldDetails<SceneDetails>;

const renderAmendableSceneDetails = (
  sceneDetails: SceneDetails,
  oldSceneDetails: OldSceneDetails | undefined,
  showDiff: boolean,
  state: AmendmentState,
  callbacks: AmendableEditCallbacks,
) => (
  <>
    {sceneDetails.title && (
      <AmendableChangeRow
        name="Title"
        field="title"
        newValue={sceneDetails.title}
        oldValue={oldSceneDetails?.title}
        showDiff={showDiff}
        isRemoved={state.removedFields.has("title")}
        onRemove={callbacks.onRemoveField}
        onRestore={callbacks.onRestoreField}
      />
    )}
    <AmendableChangeRow
      name="Date"
      field="date"
      newValue={sceneDetails.date}
      oldValue={oldSceneDetails?.date}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("date")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Duration"
      field="duration"
      newValue={formatDuration(sceneDetails.duration)}
      oldValue={formatDuration(oldSceneDetails?.duration)}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("duration")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableListChangeRow
      name="Performers"
      field="performers"
      added={sceneDetails.added_performers}
      removed={sceneDetails.removed_performers}
      renderItem={renderPerformer}
      getKey={(o) => o.performer.id}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("performers")}
      removedRemovedIndices={state.removedRemovedItems.get("performers")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    <AmendableLinkedChangeRow
      name="Studio"
      field="studio_id"
      newEntity={{
        name: sceneDetails.studio?.name,
        link: sceneDetails.studio && studioHref(sceneDetails.studio),
      }}
      oldEntity={{
        name: oldSceneDetails?.studio?.name,
        link: oldSceneDetails?.studio && studioHref(oldSceneDetails.studio),
      }}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("studio_id")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableURLChangeRow
      field="urls"
      newURLs={sceneDetails.added_urls}
      oldURLs={sceneDetails.removed_urls}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("urls")}
      removedRemovedIndices={state.removedRemovedItems.get("urls")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    <AmendableChangeRow
      name="Details"
      field="details"
      newValue={sceneDetails.details}
      oldValue={oldSceneDetails?.details}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("details")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Director"
      field="director"
      newValue={sceneDetails.director}
      oldValue={oldSceneDetails?.director}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("director")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Production Date"
      field="production_date"
      newValue={sceneDetails.production_date}
      oldValue={oldSceneDetails?.production_date}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("production_date")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableChangeRow
      name="Studio Code"
      field="code"
      newValue={sceneDetails.code}
      oldValue={oldSceneDetails?.code}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("code")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableListChangeRow
      name="Tags"
      field="tags"
      added={sceneDetails.added_tags?.slice().sort(compareByName)}
      removed={sceneDetails.removed_tags?.slice().sort(compareByName)}
      renderItem={renderTag}
      getKey={(o) => o.id}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("tags")}
      removedRemovedIndices={state.removedRemovedItems.get("tags")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    <AmendableImageChangeRow
      field="images"
      newImages={sceneDetails?.added_images}
      oldImages={sceneDetails?.removed_images}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("images")}
      removedRemovedIndices={state.removedRemovedItems.get("images")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    <AmendableListChangeRow
      name="Fingerprints"
      field="fingerprints"
      added={sceneDetails.added_fingerprints}
      removed={sceneDetails.removed_fingerprints}
      renderItem={renderFingerprint}
      getKey={(o) => `${o.hash}${o.algorithm}`}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("fingerprints")}
      removedRemovedIndices={state.removedRemovedItems.get("fingerprints")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    {sceneDetails.draft_id && (
      <Row className="mb-2">
        <Col xs={{ offset: 2 }}>
          <h6>
            <Icon icon={faEdit} color="green" />
            <span className="ms-1">Submitted by draft</span>
          </h6>
        </Col>
      </Row>
    )}
  </>
);

export interface StudioDetails {
  name?: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  added_images?: (Image | null)[] | null;
  removed_images?: (Image | null)[] | null;
  added_urls?: URL[] | null;
  removed_urls?: URL[] | null;
  added_aliases?: string[] | null;
  removed_aliases?: string[] | null;
}

export type OldStudioDetails = TargetOldDetails<StudioDetails>;

const renderAmendableStudioDetails = (
  studioDetails: StudioDetails,
  oldStudioDetails: OldStudioDetails | undefined,
  showDiff: boolean,
  state: AmendmentState,
  callbacks: AmendableEditCallbacks,
) => (
  <>
    <AmendableChangeRow
      name="Name"
      field="name"
      newValue={studioDetails.name}
      oldValue={oldStudioDetails?.name}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("name")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableListChangeRow
      name="Aliases"
      field="aliases"
      added={studioDetails.added_aliases?.map((a) => ({ value: a }))}
      removed={studioDetails.removed_aliases?.map((a) => ({ value: a }))}
      renderItem={(o) => <>{o.value}</>}
      getKey={(o) => o.value}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("aliases")}
      removedRemovedIndices={state.removedRemovedItems.get("aliases")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    <AmendableLinkedChangeRow
      name="Network"
      field="parent_id"
      newEntity={{
        name: studioDetails.parent?.name,
        link: studioDetails.parent && studioHref(studioDetails.parent),
      }}
      oldEntity={{
        name: oldStudioDetails?.parent?.name,
        link: oldStudioDetails?.parent && studioHref(oldStudioDetails.parent),
      }}
      showDiff={showDiff}
      isRemoved={state.removedFields.has("parent_id")}
      onRemove={callbacks.onRemoveField}
      onRestore={callbacks.onRestoreField}
    />
    <AmendableURLChangeRow
      field="urls"
      newURLs={studioDetails.added_urls}
      oldURLs={studioDetails.removed_urls}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("urls")}
      removedRemovedIndices={state.removedRemovedItems.get("urls")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
    <AmendableImageChangeRow
      field="images"
      newImages={studioDetails.added_images}
      oldImages={studioDetails.removed_images}
      showDiff={showDiff}
      removedAddedIndices={state.removedAddedItems.get("images")}
      removedRemovedIndices={state.removedRemovedItems.get("images")}
      onRemoveAddedItem={callbacks.onRemoveAddedItem}
      onRemoveRemovedItem={callbacks.onRemoveRemovedItem}
      onRestoreAddedItem={callbacks.onRestoreAddedItem}
      onRestoreRemovedItem={callbacks.onRestoreRemovedItem}
    />
  </>
);

interface AmendableModifyEditProps {
  details: Details | null;
  oldDetails?: OldDetails | null;
  options?: Options;
  state: AmendmentState;
  callbacks: AmendableEditCallbacks;
}

const AmendableModifyEdit: FC<AmendableModifyEditProps> = ({
  details,
  oldDetails,
  options,
  state,
  callbacks,
}) => {
  if (!details) return null;

  const showDiff = !!oldDetails;

  if (isTagEdit(details) && (isTagEdit(oldDetails) || !oldDetails)) {
    return renderAmendableTagDetails(
      details,
      oldDetails ?? undefined,
      showDiff,
      state,
      callbacks,
    );
  }

  if (
    isPerformerEdit(details) &&
    (isPerformerEdit(oldDetails) || !oldDetails)
  ) {
    return renderAmendablePerformerDetails(
      details,
      oldDetails ?? undefined,
      showDiff,
      options?.set_modify_aliases ?? false,
      state,
      callbacks,
    );
  }

  if (isStudioEdit(details) && (isStudioEdit(oldDetails) || !oldDetails)) {
    return renderAmendableStudioDetails(
      details,
      oldDetails ?? undefined,
      showDiff,
      state,
      callbacks,
    );
  }

  if (isSceneEdit(details) && (isSceneEdit(oldDetails) || !oldDetails)) {
    return renderAmendableSceneDetails(
      details,
      oldDetails ?? undefined,
      showDiff,
      state,
      callbacks,
    );
  }

  return null;
};

export default AmendableModifyEdit;
