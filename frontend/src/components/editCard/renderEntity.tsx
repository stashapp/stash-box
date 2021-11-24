import { Link } from "react-router-dom";

import { Edits_queryEdits_edits_details_SceneEdit_added_performers as Appearance } from "src/graphql/definitions/Edits";
import { FingerprintAlgorithm } from "src/graphql";

import { performerHref, tagHref, createHref, formatDuration } from "src/utils";
import { GenderIcon, PerformerName, TagLink } from "src/components/fragments";
import { ROUTE_SCENES } from "src/constants";

export const renderPerformer = (appearance: {
  as: string | null;
  performer: Pick<
    Appearance["performer"],
    "name" | "id" | "gender" | "name" | "disambiguation" | "deleted"
  >;
}) => (
  <Link
    key={appearance.performer.id}
    to={performerHref(appearance.performer)}
    className="scene-performer"
  >
    <GenderIcon gender={appearance.performer.gender} />
    <PerformerName performer={appearance.performer} as={appearance.as} />
  </Link>
);

export const renderTag = (tag: { id: string; name: string }) => (
  <li key={tag.name}>
    <TagLink title={tag.name} link={tagHref(tag)} />
  </li>
);

export const renderFingerprint = (fingerprint: {
  hash: string;
  duration: number;
  algorithm: FingerprintAlgorithm;
}) => (
  <>
    <Link to={`${createHref(ROUTE_SCENES)}?fingerprint=${fingerprint.hash}`}>
      {fingerprint.algorithm}: {fingerprint.hash}
    </Link>
    <span title={formatDuration(fingerprint.duration)}>
      {" "}
      ({fingerprint.duration})
    </span>
  </>
);
