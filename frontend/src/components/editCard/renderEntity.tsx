import { Link } from "react-router-dom";

import { FingerprintAlgorithm, PerformerFragment } from "src/graphql";

import { performerHref, tagHref, createHref, formatDuration } from "src/utils";
import { GenderIcon, PerformerName, TagLink } from "src/components/fragments";
import { ROUTE_SCENES } from "src/constants";

type Appearance = {
  performer: PerformerFragment;
  as: string;
};

export const renderPerformer = (appearance: {
  as?: string | null;
  performer: Pick<
    Appearance["performer"],
    "name" | "id" | "gender" | "name" | "disambiguation" | "deleted"
  >;
}) => (
  <Link key={appearance.performer.id} to={performerHref(appearance.performer)}>
    <GenderIcon gender={appearance.performer.gender} />
    <PerformerName performer={appearance.performer} as={appearance.as} />
  </Link>
);

export const renderTag = (tag: { id: string; name: string }) => (
  <TagLink title={tag.name} link={tagHref(tag)} />
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
    <span title={`${fingerprint.duration}s`}>
      {", duration: "}
      {formatDuration(fingerprint.duration)}
    </span>
  </>
);
