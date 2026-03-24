import type { FC } from "react";
import { Col, Row, Button } from "react-bootstrap";
import {
  faCheck,
  faXmark,
  faEdit,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import type {
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
import type {
  PerformerDetails,
  OldPerformerDetails,
  SceneDetails,
  OldSceneDetails,
  StudioDetails,
  OldStudioDetails,
  TagDetails,
  OldTagDetails,
} from "src/components/editCard/ModifyEdit";
import { useAmendment } from "./AmendmentContext";

type Details = EditFragment["details"];
type OldDetails = EditFragment["old_details"];
type Options = EditFragment["options"];

// Special component for Bra Size which combines band_size and cup_size
const AmendableBraSizeRow: FC<{
  newBandSize?: number | null;
  newCupSize?: string | null;
  oldBandSize?: number | null;
  oldCupSize?: string | null;
  showDiff: boolean;
}> = ({ newBandSize, newCupSize, oldBandSize, oldCupSize, showDiff }) => {
  const { state, clearField, restoreField } = useAmendment();
  const isRemoved =
    state.removedFields.has("band_size") || state.removedFields.has("cup_size");

  const newValue = `${newBandSize || ""}${newCupSize ?? ""}`;
  const oldValue = `${oldBandSize || ""}${oldCupSize ?? ""}`;

  if (!newValue && !oldValue) return null;

  const handleClear = () => {
    clearField("band_size");
    clearField("cup_size");
  };

  const handleRestore = () => {
    restoreField("band_size");
    restoreField("cup_size");
  };

  return (
    <Row
      className={cx("mb-2", {
        "opacity-50 text-decoration-line-through": isRemoved,
      })}
    >
      <b className="col-2 text-end pt-1">Bra Size</b>
      {showDiff && (
        <Col xs={4}>
          <div className="EditDiff bg-danger">{oldValue}</div>
        </Col>
      )}
      <Col xs={showDiff ? 4 : 8}>
        <div className={cx("EditDiff", { "bg-success": showDiff })}>
          {newValue}
        </div>
      </Col>
      <Col xs={2} className="text-end">
        {!isRemoved && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleClear}
            title="Remove Bra Size change"
          >
            <Icon icon={faXmark} />
          </Button>
        )}
        {isRemoved && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRestore}
            title="Restore Bra Size change"
          >
            <Icon icon={faUndo} />
          </Button>
        )}
      </Col>
    </Row>
  );
};

const renderAmendableTagDetails = (
  tagDetails: TagDetails,
  oldTagDetails: OldTagDetails | undefined,
  showDiff: boolean,
) => (
  <>
    <AmendableChangeRow
      name="Name"
      field="name"
      newValue={tagDetails.name}
      oldValue={oldTagDetails?.name}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Description"
      field="description"
      newValue={tagDetails.description}
      oldValue={oldTagDetails?.description}
      showDiff={showDiff}
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
    />
    <AmendableListChangeRow
      name="Aliases"
      field="aliases"
      added={tagDetails.added_aliases?.map((a) => ({ value: a }))}
      removed={tagDetails.removed_aliases?.map((a) => ({ value: a }))}
      renderItem={(o) => <>{o.value}</>}
      getKey={(o) => o.value}
      showDiff={showDiff}
    />
  </>
);

const renderAmendablePerformerDetails = (
  performerDetails: PerformerDetails,
  oldPerformerDetails: OldPerformerDetails | undefined,
  showDiff: boolean,
  setModifyAliases: boolean,
) => (
  <>
    {performerDetails.name && (
      <AmendableChangeRow
        name="Name"
        field="name"
        newValue={performerDetails.name}
        oldValue={oldPerformerDetails?.name}
        showDiff={showDiff}
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
    />
    <AmendableListChangeRow
      name="Aliases"
      field="aliases"
      added={performerDetails.added_aliases?.map((a) => ({ value: a }))}
      removed={performerDetails.removed_aliases?.map((a) => ({ value: a }))}
      renderItem={(o) => <>{o.value}</>}
      getKey={(o) => o.value}
      showDiff={showDiff}
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
    />
    <AmendableChangeRow
      name="Birthdate"
      field="birthdate"
      newValue={performerDetails.birthdate}
      oldValue={oldPerformerDetails?.birthdate}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Deathdate"
      field="deathdate"
      newValue={performerDetails.deathdate}
      oldValue={oldPerformerDetails?.deathdate}
      showDiff={showDiff}
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
    />
    <AmendableChangeRow
      name="Height"
      field="height"
      newValue={performerDetails.height}
      oldValue={oldPerformerDetails?.height}
      showDiff={showDiff}
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
    />
    <AmendableBraSizeRow
      newBandSize={performerDetails.band_size}
      newCupSize={performerDetails.cup_size}
      oldBandSize={oldPerformerDetails?.band_size}
      oldCupSize={oldPerformerDetails?.cup_size}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Waist Size"
      field="waist_size"
      newValue={performerDetails.waist_size}
      oldValue={oldPerformerDetails?.waist_size}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Hip Size"
      field="hip_size"
      newValue={performerDetails.hip_size}
      oldValue={oldPerformerDetails?.hip_size}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Nationality"
      field="country"
      newValue={getCountryByISO(performerDetails.country)}
      oldValue={getCountryByISO(oldPerformerDetails?.country)}
      showDiff={showDiff}
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
    />
    <AmendableChangeRow
      name="Career Start"
      field="career_start_year"
      newValue={performerDetails.career_start_year}
      oldValue={oldPerformerDetails?.career_start_year}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Career End"
      field="career_end_year"
      newValue={performerDetails.career_end_year}
      oldValue={oldPerformerDetails?.career_end_year}
      showDiff={showDiff}
    />
    <AmendableListChangeRow
      name="Tattoos"
      field="tattoos"
      added={performerDetails.added_tattoos}
      removed={performerDetails.removed_tattoos}
      renderItem={(o) => <>{formatBodyModification(o)}</>}
      getKey={(o) => `${o.location}-${o.description ?? ""}`}
      showDiff={showDiff}
    />
    <AmendableListChangeRow
      name="Piercings"
      field="piercings"
      added={performerDetails.added_piercings}
      removed={performerDetails.removed_piercings}
      renderItem={(o) => <>{formatBodyModification(o)}</>}
      getKey={(o) => `${o.location}-${o.description ?? ""}`}
      showDiff={showDiff}
    />
    <AmendableURLChangeRow
      field="urls"
      newURLs={performerDetails.added_urls}
      oldURLs={performerDetails.removed_urls}
      showDiff={showDiff}
    />
    <AmendableImageChangeRow
      field="images"
      newImages={performerDetails.added_images}
      oldImages={performerDetails.removed_images}
      showDiff={showDiff}
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

const renderAmendableSceneDetails = (
  sceneDetails: SceneDetails,
  oldSceneDetails: OldSceneDetails | undefined,
  showDiff: boolean,
) => (
  <>
    {sceneDetails.title && (
      <AmendableChangeRow
        name="Title"
        field="title"
        newValue={sceneDetails.title}
        oldValue={oldSceneDetails?.title}
        showDiff={showDiff}
      />
    )}
    <AmendableChangeRow
      name="Date"
      field="date"
      newValue={sceneDetails.date}
      oldValue={oldSceneDetails?.date}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Duration"
      field="duration"
      newValue={formatDuration(sceneDetails.duration)}
      oldValue={formatDuration(oldSceneDetails?.duration)}
      showDiff={showDiff}
    />
    <AmendableListChangeRow
      name="Performers"
      field="performers"
      added={sceneDetails.added_performers}
      removed={sceneDetails.removed_performers}
      renderItem={renderPerformer}
      getKey={(o) => o.performer.id}
      showDiff={showDiff}
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
    />
    <AmendableURLChangeRow
      field="urls"
      newURLs={sceneDetails.added_urls}
      oldURLs={sceneDetails.removed_urls}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Details"
      field="details"
      newValue={sceneDetails.details}
      oldValue={oldSceneDetails?.details}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Director"
      field="director"
      newValue={sceneDetails.director}
      oldValue={oldSceneDetails?.director}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Production Date"
      field="production_date"
      newValue={sceneDetails.production_date}
      oldValue={oldSceneDetails?.production_date}
      showDiff={showDiff}
    />
    <AmendableChangeRow
      name="Studio Code"
      field="code"
      newValue={sceneDetails.code}
      oldValue={oldSceneDetails?.code}
      showDiff={showDiff}
    />
    <AmendableListChangeRow
      name="Tags"
      field="tags"
      added={sceneDetails.added_tags?.slice().sort(compareByName)}
      removed={sceneDetails.removed_tags?.slice().sort(compareByName)}
      renderItem={renderTag}
      getKey={(o) => o.id}
      showDiff={showDiff}
    />
    <AmendableImageChangeRow
      field="images"
      newImages={sceneDetails?.added_images}
      oldImages={sceneDetails?.removed_images}
      showDiff={showDiff}
    />
    <AmendableListChangeRow
      name="Fingerprints"
      field="fingerprints"
      added={sceneDetails.added_fingerprints}
      removed={sceneDetails.removed_fingerprints}
      renderItem={renderFingerprint}
      getKey={(o) => `${o.hash}${o.algorithm}`}
      showDiff={showDiff}
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

const renderAmendableStudioDetails = (
  studioDetails: StudioDetails,
  oldStudioDetails: OldStudioDetails | undefined,
  showDiff: boolean,
) => (
  <>
    <AmendableChangeRow
      name="Name"
      field="name"
      newValue={studioDetails.name}
      oldValue={oldStudioDetails?.name}
      showDiff={showDiff}
    />
    <AmendableListChangeRow
      name="Aliases"
      field="aliases"
      added={studioDetails.added_aliases?.map((a) => ({ value: a }))}
      removed={studioDetails.removed_aliases?.map((a) => ({ value: a }))}
      renderItem={(o) => <>{o.value}</>}
      getKey={(o) => o.value}
      showDiff={showDiff}
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
    />
    <AmendableURLChangeRow
      field="urls"
      newURLs={studioDetails.added_urls}
      oldURLs={studioDetails.removed_urls}
      showDiff={showDiff}
    />
    <AmendableImageChangeRow
      field="images"
      newImages={studioDetails.added_images}
      oldImages={studioDetails.removed_images}
      showDiff={showDiff}
    />
  </>
);

interface AmendableModifyEditProps {
  details: Details | null;
  oldDetails?: OldDetails | null;
  options?: Options;
}

const AmendableModifyEdit: FC<AmendableModifyEditProps> = ({
  details,
  oldDetails,
  options,
}) => {
  if (!details) return null;

  const showDiff = !!oldDetails;

  if (isTagEdit(details) && (isTagEdit(oldDetails) || !oldDetails)) {
    return renderAmendableTagDetails(
      details,
      oldDetails ?? undefined,
      showDiff,
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
    );
  }

  if (isStudioEdit(details) && (isStudioEdit(oldDetails) || !oldDetails)) {
    return renderAmendableStudioDetails(
      details,
      oldDetails ?? undefined,
      showDiff,
    );
  }

  if (isSceneEdit(details) && (isSceneEdit(oldDetails) || !oldDetails)) {
    return renderAmendableSceneDetails(
      details,
      oldDetails ?? undefined,
      showDiff,
    );
  }

  return null;
};

export default AmendableModifyEdit;
